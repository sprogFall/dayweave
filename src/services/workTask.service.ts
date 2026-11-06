import { supabase } from '@/lib/supabase';
import type { WorkTask } from '@/types/domain';
import { toWorkTask, type WorkTaskRow } from '@/types/db';

const COLUMNS =
  'id, user_id, title, description, estimated_minutes, start_date, due_date, status, completed_at, created_at, updated_at';

export interface WorkTaskInput {
  title: string;
  description: string;
  estimatedMinutes: number;
  /** YYYY-MM-DD，均按用户本地自然日。 */
  startDate: string;
  dueDate: string;
}

export async function listWorkTasks(userId: string): Promise<WorkTask[]> {
  const { data, error } = await supabase
    .from('dw_work_tasks')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .returns<WorkTaskRow[]>();

  if (error) throw new Error('读取任务失败，请稍后重试。');
  return (data ?? []).map(toWorkTask);
}

export async function createWorkTask(userId: string, input: WorkTaskInput): Promise<WorkTask> {
  const { data, error } = await supabase
    .from('dw_work_tasks')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      estimated_minutes: input.estimatedMinutes,
      start_date: input.startDate,
      due_date: input.dueDate,
    })
    .select(COLUMNS)
    .single<WorkTaskRow>();

  if (error) throw new Error('创建任务失败，请稍后重试。');
  return toWorkTask(data);
}

export async function updateWorkTask(
  userId: string,
  id: string,
  input: WorkTaskInput,
): Promise<WorkTask> {
  const { data, error } = await supabase
    .from('dw_work_tasks')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      estimated_minutes: input.estimatedMinutes,
      start_date: input.startDate,
      due_date: input.dueDate,
    })
    .eq('user_id', userId)
    .eq('id', id)
    .select(COLUMNS)
    .single<WorkTaskRow>();

  if (error) throw new Error('保存任务失败，请稍后重试。');
  return toWorkTask(data);
}

/** 完成与重新打开共用一处，保证 completed_at 与 status 始终一致。 */
export async function setWorkTaskDone(
  userId: string,
  id: string,
  done: boolean,
): Promise<WorkTask> {
  const { data, error } = await supabase
    .from('dw_work_tasks')
    .update({
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
    .eq('id', id)
    .select(COLUMNS)
    .single<WorkTaskRow>();

  if (error) throw new Error('更新任务状态失败，请稍后重试。');
  return toWorkTask(data);
}

/** 删除任务时，挂在上面的工时记录由数据库外键级联删除。 */
export async function deleteWorkTask(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('dw_work_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw new Error('删除任务失败，请稍后重试。');
}
