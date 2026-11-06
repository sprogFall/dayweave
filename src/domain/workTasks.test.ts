import type { WorkLog, WorkTask } from '@/types/domain';

import {
  countByStatus,
  isOverdue,
  progressPercent,
  sortTasks,
  taskProgress,
} from './workTasks';

function task(overrides: Partial<WorkTask> = {}): WorkTask {
  return {
    id: 'task-1',
    title: '重构工时模块',
    description: '',
    estimatedMinutes: 0,
    startDate: '2026-11-02',
    dueDate: '2026-11-08',
    status: 'open',
    completedAt: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...overrides,
  };
}

function log(taskId: string, minutes: number): WorkLog {
  return {
    id: `${taskId}-${minutes}`,
    taskId,
    content: '',
    minutes,
    date: '2026-11-06',
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
  };
}

describe('workTasks', () => {
  it('computes progress against the estimate', () => {
    const progress = taskProgress([log('task-1', 120), log('task-2', 60)], 'task-1', 480);

    expect(progress.usedMinutes).toBe(120);
    expect(progress.remainingMinutes).toBe(360);
    expect(progress.ratio).toBe(0.25);
    expect(progress.over).toBe(false);
  });

  it('flags overruns and stops the remaining count at zero', () => {
    const progress = taskProgress([log('task-1', 500)], 'task-1', 480);

    expect(progress.over).toBe(true);
    expect(progress.remainingMinutes).toBe(0);
    expect(progress.ratio).toBeGreaterThan(1);
    expect(progressPercent(progress.ratio)).toBe(100);
  });

  it('treats an unestimated task as zero ratio', () => {
    const progress = taskProgress([log('task-1', 120)], 'task-1', 0);

    expect(progress.ratio).toBe(0);
    expect(progress.over).toBe(false);
    expect(progress.usedMinutes).toBe(120);
  });

  it('clamps the progress bar percentage', () => {
    expect(progressPercent(0)).toBe(0);
    expect(progressPercent(0.456)).toBe(46);
    expect(progressPercent(-1)).toBe(0);
  });

  it('marks open tasks past their due date as overdue', () => {
    expect(isOverdue(task({ dueDate: '2026-11-05' }), '2026-11-06')).toBe(true);
    expect(isOverdue(task({ dueDate: '2026-11-06' }), '2026-11-06')).toBe(false);
    expect(isOverdue(task({ dueDate: '2026-11-05', status: 'done' }), '2026-11-06')).toBe(false);
  });

  it('keeps open tasks first by due date, then finished ones by completion time', () => {
    const sorted = sortTasks([
      task({ id: 'late', dueDate: '2026-11-09' }),
      task({ id: 'done-old', status: 'done', completedAt: '2026-11-03T10:00:00.000Z' }),
      task({ id: 'soon', dueDate: '2026-11-04' }),
      task({ id: 'done-new', status: 'done', completedAt: '2026-11-05T10:00:00.000Z' }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['soon', 'late', 'done-new', 'done-old']);
  });

  it('counts tasks by status', () => {
    expect(countByStatus([task(), task({ id: 'b', status: 'done' }), task({ id: 'c' })])).toEqual({
      open: 2,
      done: 1,
    });
  });
});
