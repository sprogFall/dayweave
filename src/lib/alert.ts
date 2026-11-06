import { DEFAULT_MESSAGE_TEXT, enqueueDialog } from '@/lib/dialog';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface MessageOptions {
  confirmText?: string;
}

/** 统一的确认框入口；平台原生 Alert / window.confirm 不再参与 UI。 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return enqueueDialog<boolean>({ kind: 'confirm', ...options });
}

export function showMessage(
  title: string,
  message?: string,
  options: MessageOptions = {},
): Promise<void> {
  return enqueueDialog<void>({
    kind: 'message',
    title,
    message,
    confirmText: options.confirmText ?? DEFAULT_MESSAGE_TEXT,
  });
}
