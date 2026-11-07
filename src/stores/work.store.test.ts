import type { Session } from '@supabase/supabase-js';

import {
  createWorkLog,
  deleteWorkLog,
  listWorkLogs,
  updateWorkLog,
} from '@/services/workLog.service';
import {
  createWorkTask,
  deleteWorkTask,
  listWorkTasks,
  setWorkTaskDone,
} from '@/services/workTask.service';
import { useAuthStore } from '@/stores/auth.store';
import type { WorkLog, WorkTask } from '@/types/domain';

import { useWorkStore } from './work.store';

jest.mock('@/services/workTask.service', () => ({
  createWorkTask: jest.fn(),
  deleteWorkTask: jest.fn(),
  listWorkTasks: jest.fn(),
  setWorkTaskDone: jest.fn(),
  updateWorkTask: jest.fn(),
}));

jest.mock('@/services/workLog.service', () => ({
  createWorkLog: jest.fn(),
  deleteWorkLog: jest.fn(),
  listWorkLogs: jest.fn(),
  updateWorkLog: jest.fn(),
}));

const listTasksMock = listWorkTasks as jest.MockedFunction<typeof listWorkTasks>;
const createTaskMock = createWorkTask as jest.MockedFunction<typeof createWorkTask>;
const deleteTaskMock = deleteWorkTask as jest.MockedFunction<typeof deleteWorkTask>;
const setDoneMock = setWorkTaskDone as jest.MockedFunction<typeof setWorkTaskDone>;
const listLogsMock = listWorkLogs as jest.MockedFunction<typeof listWorkLogs>;
const createLogMock = createWorkLog as jest.MockedFunction<typeof createWorkLog>;
const updateLogMock = updateWorkLog as jest.MockedFunction<typeof updateWorkLog>;
const deleteLogMock = deleteWorkLog as jest.MockedFunction<typeof deleteWorkLog>;

function task(overrides: Partial<WorkTask> = {}): WorkTask {
  return {
    id: 'task-1',
    title: '重构工时模块',
    description: '',
    estimatedMinutes: 480,
    startDate: '2026-11-02',
    dueDate: '2026-11-08',
    status: 'open',
    completedAt: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...overrides,
  };
}

function log(overrides: Partial<WorkLog> = {}): WorkLog {
  return {
    id: 'log-1',
    taskId: 'task-1',
    content: '拆数据模型',
    minutes: 135,
    date: '2026-11-06',
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
    ...overrides,
  };
}

function signIn(userId: string | null) {
  useAuthStore.setState({
    session: userId === null ? null : ({ user: { id: userId } } as unknown as Session),
    status: userId === null ? 'signedOut' : 'signedIn',
  });
}

const taskInput = {
  title: '重构工时模块',
  description: '',
  estimatedMinutes: 480,
  startDate: '2026-11-02',
  dueDate: '2026-11-08',
};

describe('work store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWorkStore.getState().reset();
    signIn('user-1');
  });

  it('stays empty without a session and never hits the network', async () => {
    signIn(null);

    await useWorkStore.getState().load();

    expect(listTasksMock).not.toHaveBeenCalled();
    expect(listLogsMock).not.toHaveBeenCalled();
    expect(useWorkStore.getState().status).toBe('ready');
    expect(useWorkStore.getState().tasks).toEqual([]);
  });

  it('loads tasks and logs together', async () => {
    listTasksMock.mockResolvedValue([task()]);
    listLogsMock.mockResolvedValue([log()]);

    await useWorkStore.getState().load();

    expect(listLogsMock).toHaveBeenCalledWith('user-1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(useWorkStore.getState().tasks).toHaveLength(1);
    expect(useWorkStore.getState().logs).toHaveLength(1);
    expect(useWorkStore.getState().status).toBe('ready');
  });

  it('records an error message instead of throwing', async () => {
    listTasksMock.mockRejectedValue(new Error('读取任务失败，请稍后重试。'));
    listLogsMock.mockResolvedValue([]);

    await useWorkStore.getState().load();

    expect(useWorkStore.getState().status).toBe('error');
    expect(useWorkStore.getState().error).toBe('读取任务失败，请稍后重试。');
  });

  it('skips refetching once loaded unless forced', async () => {
    listTasksMock.mockResolvedValue([]);
    listLogsMock.mockResolvedValue([]);

    await useWorkStore.getState().load();
    await useWorkStore.getState().load();
    expect(listTasksMock).toHaveBeenCalledTimes(1);

    await useWorkStore.getState().load({ force: true });
    expect(listTasksMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a task without a name or with an inverted date range', async () => {
    await expect(
      useWorkStore.getState().createTask({ ...taskInput, title: '   ' }),
    ).rejects.toThrow('任务名不能为空。');

    await expect(
      useWorkStore.getState().createTask({
        ...taskInput,
        startDate: '2026-11-08',
        dueDate: '2026-11-02',
      }),
    ).rejects.toThrow('截止日期不能早于开始日期。');

    expect(createTaskMock).not.toHaveBeenCalled();
  });

  it('adds a created task in the sorted position', async () => {
    listTasksMock.mockResolvedValue([task({ id: 'later', dueDate: '2026-11-09' })]);
    listLogsMock.mockResolvedValue([]);
    await useWorkStore.getState().load();

    createTaskMock.mockResolvedValue(task({ id: 'sooner', dueDate: '2026-11-04' }));

    await useWorkStore.getState().createTask(taskInput);

    expect(createTaskMock).toHaveBeenCalledWith('user-1', taskInput);
    expect(useWorkStore.getState().tasks.map((item) => item.id)).toEqual(['sooner', 'later']);
  });

  it('moves a task to done and keeps it in the list', async () => {
    listTasksMock.mockResolvedValue([task()]);
    listLogsMock.mockResolvedValue([]);
    await useWorkStore.getState().load();

    setDoneMock.mockResolvedValue(task({ status: 'done', completedAt: '2026-11-06T10:00:00.000Z' }));

    await useWorkStore.getState().setTaskDone('task-1', true);

    expect(setDoneMock).toHaveBeenCalledWith('user-1', 'task-1', true);
    expect(useWorkStore.getState().tasks[0].status).toBe('done');
  });

  it('drops the task and its logs when a task is deleted', async () => {
    listTasksMock.mockResolvedValue([task(), task({ id: 'task-2' })]);
    listLogsMock.mockResolvedValue([log(), log({ id: 'log-2', taskId: 'task-2' })]);
    await useWorkStore.getState().load();

    deleteTaskMock.mockResolvedValue(undefined);

    await useWorkStore.getState().removeTask('task-1');

    expect(useWorkStore.getState().tasks.map((item) => item.id)).toEqual(['task-2']);
    expect(useWorkStore.getState().logs.map((item) => item.id)).toEqual(['log-2']);
  });

  it('prepends a new log and keeps logs newest first', async () => {
    listLogsMock.mockResolvedValue([log({ id: 'old', date: '2026-11-04' })]);
    listTasksMock.mockResolvedValue([task()]);
    await useWorkStore.getState().load();

    createLogMock.mockResolvedValue(log({ id: 'new', date: '2026-11-06' }));

    await useWorkStore.getState().addLog({
      taskId: 'task-1',
      content: '拆数据模型',
      minutes: 135,
      date: '2026-11-06',
    });

    expect(createLogMock).toHaveBeenCalledWith('user-1', {
      taskId: 'task-1',
      content: '拆数据模型',
      minutes: 135,
      date: '2026-11-06',
    });
    expect(useWorkStore.getState().logs.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('rejects a non-positive log duration', async () => {
    await expect(
      useWorkStore.getState().addLog({ taskId: 'task-1', content: '', minutes: 0, date: '2026-11-06' }),
    ).rejects.toThrow('花费时间必须大于 0。');

    expect(createLogMock).not.toHaveBeenCalled();
  });

  it('replaces an edited log in place and keeps date order', async () => {
    listLogsMock.mockResolvedValue([
      log({ id: 'log-1', date: '2026-11-06' }),
      log({ id: 'log-2', date: '2026-11-04' }),
    ]);
    listTasksMock.mockResolvedValue([task()]);
    await useWorkStore.getState().load();

    updateLogMock.mockResolvedValue(
      log({ id: 'log-1', content: '改内容', minutes: 60, date: '2026-11-03' }),
    );

    await useWorkStore.getState().updateLog('log-1', {
      taskId: 'task-1',
      content: '改内容',
      minutes: 60,
      date: '2026-11-03',
    });

    expect(updateLogMock).toHaveBeenCalledWith('user-1', 'log-1', {
      taskId: 'task-1',
      content: '改内容',
      minutes: 60,
      date: '2026-11-03',
    });
    expect(useWorkStore.getState().logs.map((item) => item.id)).toEqual(['log-2', 'log-1']);
    expect(useWorkStore.getState().logs[1].minutes).toBe(60);
  });

  it('rejects editing a log to a non-positive duration', async () => {
    await expect(
      useWorkStore
        .getState()
        .updateLog('log-1', { taskId: 'task-1', content: '', minutes: 0, date: '2026-11-06' }),
    ).rejects.toThrow('花费时间必须大于 0。');

    expect(updateLogMock).not.toHaveBeenCalled();
  });

  it('removes a deleted log', async () => {
    listLogsMock.mockResolvedValue([log()]);
    listTasksMock.mockResolvedValue([]);
    await useWorkStore.getState().load();

    deleteLogMock.mockResolvedValue(undefined);

    await useWorkStore.getState().removeLog('log-1');

    expect(deleteLogMock).toHaveBeenCalledWith('user-1', 'log-1');
    expect(useWorkStore.getState().logs).toEqual([]);
  });
});
