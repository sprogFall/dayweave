import { supabase } from '@/lib/supabase';
import { queryBuilder } from '@/test/postgrest';

import {
  createWorkTask,
  deleteWorkTask,
  listWorkTasks,
  setWorkTaskDone,
  updateWorkTask,
} from './workTask.service';

const taskRow = {
  id: 'task-1',
  user_id: 'user-1',
  title: '重构工时模块',
  description: '拆成任务 + 记录',
  estimated_minutes: '480',
  start_date: '2026-11-02',
  due_date: '2026-11-08',
  status: 'open',
  completed_at: null,
  created_at: '2026-11-02T01:00:00.000Z',
  updated_at: '2026-11-02T02:00:00.000Z',
};

const fromMock = supabase.from as jest.Mock;

describe('workTask.service', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('lists tasks of the current user and maps rows to domain objects', async () => {
    const builder = queryBuilder({ data: [taskRow], error: null });
    fromMock.mockReturnValue(builder);

    const tasks = await listWorkTasks('user-1');

    expect(fromMock).toHaveBeenCalledWith('dw_work_tasks');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(tasks).toEqual([
      {
        id: 'task-1',
        title: '重构工时模块',
        description: '拆成任务 + 记录',
        estimatedMinutes: 480,
        startDate: '2026-11-02',
        dueDate: '2026-11-08',
        status: 'open',
        completedAt: null,
        createdAt: '2026-11-02T01:00:00.000Z',
        updatedAt: '2026-11-02T02:00:00.000Z',
      },
    ]);
  });

  it('treats unknown status values as open', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: [{ ...taskRow, status: 'paused' }], error: null }));

    const tasks = await listWorkTasks('user-1');

    expect(tasks[0].status).toBe('open');
  });

  it('surfaces a readable error when listing fails', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'boom' } }));

    await expect(listWorkTasks('user-1')).rejects.toThrow('读取任务失败');
  });

  it('creates a task with trimmed text fields', async () => {
    const builder = queryBuilder({ data: taskRow, error: null });
    fromMock.mockReturnValue(builder);

    await createWorkTask('user-1', {
      title: '  重构工时模块  ',
      description: '  拆成任务 + 记录  ',
      estimatedMinutes: 480,
      startDate: '2026-11-02',
      dueDate: '2026-11-08',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: '重构工时模块',
      description: '拆成任务 + 记录',
      estimated_minutes: 480,
      start_date: '2026-11-02',
      due_date: '2026-11-08',
    });
  });

  it('updates a task scoped to the current user', async () => {
    const builder = queryBuilder({ data: taskRow, error: null });
    fromMock.mockReturnValue(builder);

    await updateWorkTask('user-1', 'task-1', {
      title: '重构工时模块',
      description: '',
      estimatedMinutes: 0,
      startDate: '2026-11-02',
      dueDate: '2026-11-08',
    });

    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ estimated_minutes: 0, description: '' }),
    );
  });

  it('keeps status and completed_at in sync', async () => {
    const done = queryBuilder({ data: { ...taskRow, status: 'done' }, error: null });
    fromMock.mockReturnValue(done);

    await setWorkTaskDone('user-1', 'task-1', true);
    expect(done.update).toHaveBeenCalledWith({
      status: 'done',
      completed_at: expect.any(String),
    });

    const reopened = queryBuilder({ data: taskRow, error: null });
    fromMock.mockReturnValue(reopened);

    await setWorkTaskDone('user-1', 'task-1', false);
    expect(reopened.update).toHaveBeenCalledWith({ status: 'open', completed_at: null });
  });

  it('deletes a task scoped to the current user', async () => {
    const builder = queryBuilder({ error: null });
    fromMock.mockReturnValue(builder);

    await deleteWorkTask('user-1', 'task-1');

    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('surfaces a readable error when deleting fails', async () => {
    fromMock.mockReturnValue(queryBuilder({ error: { message: 'boom' } }));

    await expect(deleteWorkTask('user-1', 'task-1')).rejects.toThrow('删除任务失败');
  });
});
