import { supabase } from '@/lib/supabase';
import type { WorkLog } from '@/types/domain';
import { toWorkLog, type WorkLogRow } from '@/types/db';

const COLUMNS = 'id, user_id, task_id, content, minutes, work_date, created_at, updated_at';

export interface WorkLogInput {
  taskId: string;
  content: string;
  /** 花费时间，分钟。 */
  minutes: number;
  /** YYYY-MM-DD，工时归属的本地自然日。 */
  date: string;
}

export async function listWorkLogs(userId: string, fromDate: string): Promise<WorkLog[]> {
  const { data, error } = await supabase
    .from('dw_work_logs')
    .select(COLUMNS)
    .eq('user_id', userId)
    .gte('work_date', fromDate)
    .order('work_date', { ascending: false })
    .returns<WorkLogRow[]>();

  if (error) throw new Error('读取工时记录失败，请稍后重试。');
  return (data ?? []).map(toWorkLog);
}

/** 一个任务下可以有多条记录，因此是纯新增，不做同天覆盖。 */
export async function createWorkLog(userId: string, input: WorkLogInput): Promise<WorkLog> {
  const { data, error } = await supabase
    .from('dw_work_logs')
    .insert({
      user_id: userId,
      task_id: input.taskId,
      content: input.content.trim(),
      minutes: input.minutes,
      work_date: input.date,
    })
    .select(COLUMNS)
    .single<WorkLogRow>();

  if (error) throw new Error('保存工时记录失败，请稍后重试。');
  return toWorkLog(data);
}

export async function deleteWorkLog(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('dw_work_logs')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw new Error('删除工时记录失败，请稍后重试。');
}
