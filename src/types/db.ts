import type { Profile, WorkLog, WorkTask, WorkTaskStatus } from './domain';

/** public.dw_profiles 的数据库行类型；snake_case 只允许出现在本文件。 */
export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** public.dw_work_tasks 的数据库行类型。 */
export interface WorkTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  estimated_minutes: number | string;
  start_date: string;
  due_date: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 未知状态一律视为进行中，避免脏数据把任务从列表里藏掉。 */
function toTaskStatus(value: string): WorkTaskStatus {
  return value === 'done' ? 'done' : 'open';
}

export function toWorkTask(row: WorkTaskRow): WorkTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    estimatedMinutes: Number(row.estimated_minutes),
    startDate: row.start_date,
    dueDate: row.due_date,
    status: toTaskStatus(row.status),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** public.dw_work_logs 的数据库行类型。 */
export interface WorkLogRow {
  id: string;
  user_id: string;
  task_id: string;
  content: string;
  minutes: number | string;
  work_date: string;
  created_at: string;
  updated_at: string;
}

export function toWorkLog(row: WorkLogRow): WorkLog {
  return {
    id: row.id,
    taskId: row.task_id,
    content: row.content,
    minutes: Number(row.minutes),
    date: row.work_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
