import type { ChipOption } from '@/components/ui/FilterChips';
import type { TintName } from '@/theme';

export type TaskTag = 'work' | 'life' | 'health';

export type TaskFilter = 'all' | TaskTag;

export interface TaskItem {
  id: string;
  title: string;
  tag: TaskTag;
  time: string;
  done: boolean;
}

export interface TaskGroup {
  id: string;
  title: string;
  tasks: readonly TaskItem[];
}

export const TASK_TAG_LABELS: Record<TaskTag, string> = {
  work: '工作',
  life: '生活',
  health: '健康',
};

export const TASK_TAG_TINTS: Record<TaskTag, TintName> = {
  work: 'blue',
  life: 'amber',
  health: 'mint',
};

export const TASK_FILTER_OPTIONS: readonly ChipOption<TaskFilter>[] = [
  { value: 'all', label: '全部' },
  { value: 'work', label: '工作' },
  { value: 'life', label: '生活' },
  { value: 'health', label: '健康' },
];

/** 大纲阶段的示例待办，接入真实数据后由 store 提供。 */
export const TASK_GROUPS: readonly TaskGroup[] = [
  {
    id: 'today',
    title: '今天',
    tasks: [
      { id: 't1', title: '完成项目方案初稿', tag: 'work', time: '09:00', done: true },
      { id: 't2', title: '去超市采购生活用品', tag: 'life', time: '16:00', done: false },
      { id: 't3', title: '给妈妈打个电话', tag: 'life', time: '20:00', done: false },
      { id: 't4', title: '睡前阅读 30 分钟', tag: 'health', time: '22:00', done: false },
    ],
  },
  {
    id: 'tomorrow',
    title: '明天',
    tasks: [
      { id: 't5', title: '提交本周工作总结', tag: 'work', time: '09:00', done: false },
      { id: 't6', title: '缴纳水电费', tag: 'life', time: '10:00', done: false },
      { id: 't7', title: '去医院复查', tag: 'health', time: '15:00', done: false },
    ],
  },
];

const ALL_TASKS = TASK_GROUPS.flatMap((group) => group.tasks);

export const TASK_TOTAL = ALL_TASKS.length;

export const TASK_DONE = ALL_TASKS.filter((task) => task.done).length;

export function filterTaskGroups(filter: TaskFilter): TaskGroup[] {
  if (filter === 'all') return TASK_GROUPS.map((group) => ({ ...group }));

  return TASK_GROUPS.map((group) => ({
    ...group,
    tasks: group.tasks.filter((task) => task.tag === filter),
  })).filter((group) => group.tasks.length > 0);
}
