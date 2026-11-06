import { DEFAULT_MINUTE_STEP, type TimeValue } from '@/domain/time';

export type DialogKind = 'message' | 'confirm' | 'date' | 'time';

export const DEFAULT_CONFIRM_TEXT = '确定';
export const DEFAULT_CANCEL_TEXT = '取消';
export const DEFAULT_MESSAGE_TEXT = '知道了';

export interface DialogInput {
  kind: DialogKind;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  initialTime?: TimeValue;
  minuteStep?: number;
}

export interface DialogRequest {
  id: number;
  kind: DialogKind;
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  initialTime?: TimeValue;
  minuteStep: number;
  resolve: (value: unknown) => void;
}

type Listener = (request: DialogRequest | null) => void;

const queue: DialogRequest[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

export function getActiveDialog(): DialogRequest | null {
  return queue[0] ?? null;
}

function notify(): void {
  const active = getActiveDialog();
  listeners.forEach((listener) => listener(active));
}

export function subscribeDialog(listener: Listener): () => void {
  listeners.add(listener);
  listener(getActiveDialog());
  return () => {
    listeners.delete(listener);
  };
}

/** 同一时刻只展示队首弹窗，后续请求按调用顺序排队，避免互相覆盖导致 Promise 悬挂。 */
export function enqueueDialog<T>(input: DialogInput): Promise<T> {
  return new Promise<T>((resolve) => {
    queue.push({
      ...input,
      id: nextId,
      confirmText:
        input.confirmText ??
        (input.kind === 'message' ? DEFAULT_MESSAGE_TEXT : DEFAULT_CONFIRM_TEXT),
      cancelText: input.cancelText ?? DEFAULT_CANCEL_TEXT,
      destructive: input.destructive ?? false,
      minuteStep: input.minuteStep ?? DEFAULT_MINUTE_STEP,
      // 调用方保证 T 与 kind 的结果类型一一对应，控制器内部统一收敛为 unknown。
      resolve: (value: unknown) => resolve(value as T),
    });
    nextId += 1;
    notify();
  });
}

export function resolveActiveDialog(id: number, value: unknown): void {
  if (queue[0]?.id !== id) return;
  const request = queue.shift();
  if (!request) return;
  request.resolve(value);
  notify();
}

export function dismissActiveDialog(): void {
  const active = getActiveDialog();
  if (!active) return;

  const fallback =
    active.kind === 'message' ? undefined : active.kind === 'confirm' ? false : null;
  resolveActiveDialog(active.id, fallback);
}
