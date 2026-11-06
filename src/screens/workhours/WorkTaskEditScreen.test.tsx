import type { Session } from '@supabase/supabase-js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { addDays, calendarDayKey, startOfDay } from '@/domain/calendar';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkStore } from '@/stores/work.store';
import type { WorkTask } from '@/types/domain';

import { WorkTaskEditScreen } from './WorkTaskEditScreen';

const mockGoBack = jest.fn();
let mockRouteParams: { taskId?: string } | undefined;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const today = startOfDay(new Date());

function task(overrides: Partial<WorkTask> = {}): WorkTask {
  return {
    id: 'task-1',
    title: '重构工时模块',
    description: '拆成任务 + 记录',
    estimatedMinutes: 480,
    startDate: calendarDayKey(today),
    dueDate: calendarDayKey(addDays(today, 3)),
    status: 'open',
    completedAt: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...overrides,
  };
}

const createTask = jest.fn(async () => {});
const updateTask = jest.fn(async () => {});

describe('WorkTaskEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = undefined;
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as unknown as Session,
      status: 'signedIn',
    });
    useWorkStore.setState({
      status: 'ready',
      tasks: [task()],
      logs: [],
      error: null,
      createTask,
      updateTask,
    });
  });

  it('creates a task with the default one-week span', async () => {
    render(<WorkTaskEditScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('例如 重构工时模块'), '新任务');
    fireEvent.changeText(screen.getByLabelText('预计工时 小时'), '2');
    fireEvent.changeText(screen.getByLabelText('预计工时 分钟'), '30');
    fireEvent.press(screen.getByLabelText('创建任务'));

    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith({
        title: '新任务',
        description: '',
        estimatedMinutes: 150,
        startDate: calendarDayKey(today),
        dueDate: calendarDayKey(addDays(today, 7)),
      }),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('refuses an empty task name', async () => {
    render(<WorkTaskEditScreen />);

    fireEvent.press(screen.getByLabelText('创建任务'));

    expect(await screen.findByText('请填写任务名。')).toBeTruthy();
    expect(createTask).not.toHaveBeenCalled();
  });

  it('prefills the form when editing an existing task', () => {
    mockRouteParams = { taskId: 'task-1' };

    render(<WorkTaskEditScreen />);

    expect(screen.getByDisplayValue('重构工时模块')).toBeTruthy();
    expect(screen.getByDisplayValue('拆成任务 + 记录')).toBeTruthy();
    expect(screen.getByLabelText('预计工时 小时')).toBeTruthy();
    expect(screen.getByDisplayValue('8')).toBeTruthy();
  });

  it('saves edits through the update action', async () => {
    mockRouteParams = { taskId: 'task-1' };

    render(<WorkTaskEditScreen />);

    fireEvent.changeText(screen.getByDisplayValue('重构工时模块'), '重构工时模块 2');
    fireEvent.press(screen.getByLabelText('保存'));

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: '重构工时模块 2', estimatedMinutes: 480 }),
      ),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });
});
