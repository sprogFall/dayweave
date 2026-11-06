import { create } from 'zustand';

import { addDays, calendarDayKey } from '@/domain/calendar';
import { sortTasks } from '@/domain/workTasks';
import { toUserMessage } from '@/lib/errors';
import {
  createWorkLog,
  deleteWorkLog,
  listWorkLogs,
  type WorkLogInput,
} from '@/services/workLog.service';
import {
  createWorkTask,
  deleteWorkTask,
  listWorkTasks,
  setWorkTaskDone,
  updateWorkTask,
  type WorkTaskInput,
} from '@/services/workTask.service';
import { useAuthStore } from '@/stores/auth.store';
import type { WorkLog, WorkTask } from '@/types/domain';

/**
 * 卡片只需要今天、本周与连续记录天数，取 90 天足够覆盖，
 * 又不会在工时累积后把整张表拉回来。
 */
const LOOKBACK_DAYS = 90;

const EMPTY_TASKS: readonly WorkTask[] = [];
const EMPTY_LOGS: readonly WorkLog[] = [];

export type WorkStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface WorkState {
  status: WorkStatus;
  tasks: readonly WorkTask[];
  logs: readonly WorkLog[];
  error: string | null;
  load: (options?: { force?: boolean }) => Promise<void>;
  createTask: (input: WorkTaskInput) => Promise<void>;
  updateTask: (id: string, input: WorkTaskInput) => Promise<void>;
  setTaskDone: (id: string, done: boolean) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addLog: (input: WorkLogInput) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  reset: () => void;
}

function currentUserId(): string | null {
  return useAuthStore.getState().session?.user.id ?? null;
}

function assertTaskInput(input: WorkTaskInput): void {
  if (input.title.trim().length === 0) throw new Error('任务名不能为空。');
  if (input.dueDate < input.startDate) throw new Error('截止日期不能早于开始日期。');
}

function sortLogs(logs: readonly WorkLog[]): WorkLog[] {
  return [...logs].sort((left, right) => right.date.localeCompare(left.date));
}

const initialState = {
  status: 'idle' as WorkStatus,
  tasks: EMPTY_TASKS,
  logs: EMPTY_LOGS,
  error: null,
};

export const useWorkStore = create<WorkState>((set, get) => ({
  ...initialState,

  load: async (options = {}) => {
    const userId = currentUserId();
    if (!userId) {
      set({ status: 'ready', tasks: EMPTY_TASKS, logs: EMPTY_LOGS, error: null });
      return;
    }

    // 已加载过就不重复请求，页面聚焦时的调用是廉价的。
    if (!options.force && (get().status === 'ready' || get().status === 'loading')) return;

    set({ status: 'loading', error: null });
    try {
      const from = calendarDayKey(addDays(new Date(), -(LOOKBACK_DAYS - 1)));
      const [tasks, logs] = await Promise.all([
        listWorkTasks(userId),
        listWorkLogs(userId, from),
      ]);
      set({ status: 'ready', tasks: sortTasks(tasks), logs: sortLogs(logs), error: null });
    } catch (error) {
      set({ status: 'error', error: toUserMessage(error, '读取工时数据失败，请稍后重试。') });
    }
  },

  createTask: async (input) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');
    assertTaskInput(input);

    const created = await createWorkTask(userId, input);
    set({ status: 'ready', error: null, tasks: sortTasks([...get().tasks, created]) });
  },

  updateTask: async (id, input) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');
    assertTaskInput(input);

    const updated = await updateWorkTask(userId, id, input);
    set({ tasks: sortTasks(get().tasks.map((task) => (task.id === id ? updated : task))) });
  },

  setTaskDone: async (id, done) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');

    const updated = await setWorkTaskDone(userId, id, done);
    set({ tasks: sortTasks(get().tasks.map((task) => (task.id === id ? updated : task))) });
  },

  removeTask: async (id) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');

    await deleteWorkTask(userId, id);
    // 数据库会级联删除挂在该任务上的记录，本地状态同步清掉，避免留下孤儿。
    set({
      tasks: get().tasks.filter((task) => task.id !== id),
      logs: get().logs.filter((log) => log.taskId !== id),
    });
  },

  addLog: async (input) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');
    if (input.minutes <= 0) throw new Error('花费时间必须大于 0。');

    const created = await createWorkLog(userId, input);
    set({ status: 'ready', error: null, logs: sortLogs([created, ...get().logs]) });
  },

  removeLog: async (id) => {
    const userId = currentUserId();
    if (!userId) throw new Error('登录状态已失效，请重新登录。');

    await deleteWorkLog(userId, id);
    set({ logs: get().logs.filter((log) => log.id !== id) });
  },

  reset: () => set(initialState),
}));
