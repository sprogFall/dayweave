import type { Session } from '@supabase/supabase-js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { calendarDayKey, startOfDay } from '@/domain/calendar';
import { formatDateLabel } from '@/domain/datetime';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkStore } from '@/stores/work.store';
import type { WorkLog, WorkTask } from '@/types/domain';

import { WorkHoursScreen } from './WorkHoursScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/lib/alert', () => ({
  confirmAction: jest.fn(async () => true),
  showMessage: jest.fn(),
}));

jest.mock('@/services/workTask.service', () => ({
  listWorkTasks: jest.fn(async () => []),
  createWorkTask: jest.fn(),
  updateWorkTask: jest.fn(),
  setWorkTaskDone: jest.fn(),
  deleteWorkTask: jest.fn(),
}));

jest.mock('@/services/workLog.service', () => ({
  listWorkLogs: jest.fn(async () => []),
  createWorkLog: jest.fn(),
  updateWorkLog: jest.fn(),
  deleteWorkLog: jest.fn(),
}));

const today = startOfDay(new Date());
const todayKey = calendarDayKey(today);

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
    date: todayKey,
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
    ...overrides,
  };
}

const setTaskDone = jest.fn(async () => {});
const removeTask = jest.fn(async () => {});
const addLog = jest.fn(async () => {});
const updateLog = jest.fn(async () => {});
const removeLog = jest.fn(async () => {});

function seed(tasks: readonly WorkTask[], logs: readonly WorkLog[]) {
  useWorkStore.setState({
    status: 'ready',
    tasks,
    logs,
    error: null,
    setTaskDone,
    removeTask,
    addLog,
    updateLog,
    removeLog,
  });
}

describe('WorkHoursScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as unknown as Session,
      status: 'signedIn',
    });
    seed([task()], [log()]);
  });

  it('shows the empty state when there are no tasks', () => {
    seed([], []);

    render(<WorkHoursScreen />);

    expect(screen.getByText('还没有任务。先建一个任务，再往它下面记工时。')).toBeTruthy();
    expect(screen.getByLabelText('新建任务')).toBeTruthy();
  });

  it('summarises the task progress against the estimate', () => {
    render(<WorkHoursScreen />);

    expect(screen.getByText('重构工时模块')).toBeTruthy();
    expect(screen.getByText('已用 2 小时 15 分')).toBeTruthy();
    expect(screen.getByText('预计 8 小时')).toBeTruthy();
    expect(screen.getByText('剩余 5 小时 45 分')).toBeTruthy();
    expect(screen.getAllByText('进行中').length).toBeGreaterThan(0);
  });

  it('reveals the work logs when a task is expanded', () => {
    render(<WorkHoursScreen />);

    expect(screen.queryByText('拆数据模型')).toBeNull();

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));

    expect(screen.getByText('拆数据模型')).toBeTruthy();
    expect(screen.getByLabelText('为 重构工时模块 记一笔工时')).toBeTruthy();
  });

  it('records a work log from inside the task', async () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText('为 重构工时模块 记一笔工时'));

    fireEvent.changeText(screen.getByPlaceholderText('这次做了什么'), '联调卡片');
    fireEvent.changeText(screen.getByLabelText('花费时间 小时'), '1');
    fireEvent.changeText(screen.getByLabelText('花费时间 分钟'), '30');
    fireEvent.press(screen.getByLabelText('保存工时'));

    await waitFor(() =>
      expect(addLog).toHaveBeenCalledWith({
        taskId: 'task-1',
        content: '联调卡片',
        minutes: 90,
        date: todayKey,
      }),
    );
  });

  it('refuses to save a log without content or duration', async () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText('为 重构工时模块 记一笔工时'));
    fireEvent.press(screen.getByLabelText('保存工时'));

    expect(await screen.findByText('请填写这次做了什么。')).toBeTruthy();
    expect(addLog).not.toHaveBeenCalled();
  });

  it('prefills and saves an edited work log', async () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText(`编辑 ${formatDateLabel(today)} 的工时记录`));

    expect(screen.getByDisplayValue('拆数据模型')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('花费时间 分钟'), '45');
    fireEvent.press(screen.getByLabelText('保存修改'));

    await waitFor(() =>
      expect(updateLog).toHaveBeenCalledWith('log-1', {
        taskId: 'task-1',
        content: '拆数据模型',
        minutes: 165,
        date: todayKey,
      }),
    );
    expect(addLog).not.toHaveBeenCalled();
  });

  it('opens the task form when editing a task', () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText('编辑 重构工时模块'));

    expect(mockNavigate).toHaveBeenCalledWith('WorkTaskEdit', { taskId: 'task-1' });
  });

  it('marks a task done from the expanded actions', async () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText('完成 重构工时模块'));

    await waitFor(() => expect(setTaskDone).toHaveBeenCalledWith('task-1', true));
  });

  it('deletes a task after confirmation', async () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    fireEvent.press(screen.getByLabelText('删除任务 重构工时模块'));

    await waitFor(() => expect(removeTask).toHaveBeenCalledWith('task-1'));
  });

  it('groups finished tasks separately', () => {
    seed([task({ status: 'done', completedAt: '2026-11-06T10:00:00.000Z' })], []);

    render(<WorkHoursScreen />);

    expect(screen.getAllByText('已完成').length).toBeGreaterThan(0);

    fireEvent.press(screen.getByLabelText('展开 重构工时模块'));
    expect(screen.getByLabelText('重新打开 重构工时模块')).toBeTruthy();
  });

  it('opens the task form from the new-task button', () => {
    render(<WorkHoursScreen />);

    fireEvent.press(screen.getByLabelText('新建任务'));

    expect(mockNavigate).toHaveBeenCalledWith('WorkTaskEdit');
  });
});
