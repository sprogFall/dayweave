import type { WorkLog, WorkTask, WorkTaskStatus } from '@/types/domain';

import { sumMinutes } from './workStats';

export const TASK_STATUS_LABELS: Record<WorkTaskStatus, string> = {
  open: '进行中',
  done: '已完成',
};

export interface TaskProgress {
  usedMinutes: number;
  /** 0 表示未估工时。 */
  estimatedMinutes: number;
  /** 剩余分钟，超支时为 0。 */
  remainingMinutes: number;
  /** 已用 / 预计；未估时为 0，超支时大于 1。 */
  ratio: number;
  over: boolean;
}

export function taskProgress(
  logs: readonly WorkLog[],
  taskId: string,
  estimatedMinutes: number,
): TaskProgress {
  const usedMinutes = sumMinutes(logs.filter((log) => log.taskId === taskId));
  const estimated = Math.max(0, estimatedMinutes);
  const ratio = estimated === 0 ? 0 : usedMinutes / estimated;

  return {
    usedMinutes,
    estimatedMinutes: estimated,
    remainingMinutes: Math.max(estimated - usedMinutes, 0),
    ratio,
    over: estimated > 0 && usedMinutes > estimated,
  };
}

/** 进度条宽度百分比，超支时封顶 100。 */
export function progressPercent(ratio: number): number {
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function isOverdue(task: WorkTask, todayKey: string): boolean {
  return task.status === 'open' && task.dueDate < todayKey;
}

/**
 * 进行中在前、已完成沉底；进行中按截止日升序（急的先看），
 * 已完成按完成时间倒序（刚做完的在上）。
 */
export function sortTasks(tasks: readonly WorkTask[]): WorkTask[] {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'open' ? -1 : 1;

    if (left.status === 'open') return left.dueDate.localeCompare(right.dueDate);

    const leftDone = left.completedAt ?? left.updatedAt;
    const rightDone = right.completedAt ?? right.updatedAt;
    return rightDone.localeCompare(leftDone);
  });
}

export function countByStatus(tasks: readonly WorkTask[]): { open: number; done: number } {
  let open = 0;
  let done = 0;
  tasks.forEach((task) => {
    if (task.status === 'done') done += 1;
    else open += 1;
  });
  return { open, done };
}
