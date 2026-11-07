import { supabase } from '@/lib/supabase';
import { queryBuilder } from '@/test/postgrest';

import { createWorkLog, deleteWorkLog, listWorkLogs, updateWorkLog } from './workLog.service';

const logRow = {
  id: 'log-1',
  user_id: 'user-1',
  task_id: 'task-1',
  content: '拆数据模型',
  minutes: '135',
  work_date: '2026-11-06',
  created_at: '2026-11-06T01:00:00.000Z',
  updated_at: '2026-11-06T02:00:00.000Z',
};

const fromMock = supabase.from as jest.Mock;

describe('workLog.service', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('lists logs since a date and maps them to domain objects', async () => {
    const builder = queryBuilder({ data: [logRow], error: null });
    fromMock.mockReturnValue(builder);

    const logs = await listWorkLogs('user-1', '2026-08-09');

    expect(fromMock).toHaveBeenCalledWith('dw_work_logs');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.gte).toHaveBeenCalledWith('work_date', '2026-08-09');
    expect(logs).toEqual([
      {
        id: 'log-1',
        taskId: 'task-1',
        content: '拆数据模型',
        minutes: 135,
        date: '2026-11-06',
        createdAt: '2026-11-06T01:00:00.000Z',
        updatedAt: '2026-11-06T02:00:00.000Z',
      },
    ]);
  });

  it('returns an empty list when there are no rows', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: null }));

    await expect(listWorkLogs('user-1', '2026-08-09')).resolves.toEqual([]);
  });

  it('surfaces a readable error when listing fails', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'boom' } }));

    await expect(listWorkLogs('user-1', '2026-08-09')).rejects.toThrow('读取工时记录失败');
  });

  it('creates a log attached to a task', async () => {
    const builder = queryBuilder({ data: logRow, error: null });
    fromMock.mockReturnValue(builder);

    const saved = await createWorkLog('user-1', {
      taskId: 'task-1',
      content: '  拆数据模型  ',
      minutes: 135,
      date: '2026-11-06',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      task_id: 'task-1',
      content: '拆数据模型',
      minutes: 135,
      work_date: '2026-11-06',
    });
    expect(saved.minutes).toBe(135);
  });

  it('surfaces a readable error when saving fails', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'boom' } }));

    await expect(
      createWorkLog('user-1', { taskId: 'task-1', content: '', minutes: 30, date: '2026-11-06' }),
    ).rejects.toThrow('保存工时记录失败');
  });

  it('updates an existing log scoped to the current user', async () => {
    const builder = queryBuilder({ data: { ...logRow, content: '改内容', minutes: '90' }, error: null });
    fromMock.mockReturnValue(builder);

    const saved = await updateWorkLog('user-1', 'log-1', {
      taskId: 'task-1',
      content: '  改内容  ',
      minutes: 90,
      date: '2026-11-05',
    });

    expect(builder.update).toHaveBeenCalledWith({
      content: '改内容',
      minutes: 90,
      work_date: '2026-11-05',
    });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('id', 'log-1');
    expect(saved.content).toBe('改内容');
    expect(saved.minutes).toBe(90);
  });

  it('surfaces a readable error when updating fails', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'boom' } }));

    await expect(
      updateWorkLog('user-1', 'log-1', {
        taskId: 'task-1',
        content: '改内容',
        minutes: 90,
        date: '2026-11-05',
      }),
    ).rejects.toThrow('保存工时记录失败');
  });

  it('deletes a log scoped to the current user', async () => {
    const builder = queryBuilder({ error: null });
    fromMock.mockReturnValue(builder);

    await deleteWorkLog('user-1', 'log-1');

    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('id', 'log-1');
  });
});
