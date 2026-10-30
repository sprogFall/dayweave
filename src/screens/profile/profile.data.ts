import type { OverviewStat } from '@/screens/today/today.data';

/** 大纲阶段的个人页统计示例，接入真实数据后由 store 提供。 */
export const PROFILE_STATS: readonly OverviewStat[] = [
  { id: 'week-hours', label: '本周工时', value: '32.5', unit: '小时', tint: 'blue' },
  { id: 'done-tasks', label: '完成待办', value: '1', unit: '项', tint: 'mint' },
  { id: 'streak', label: '记录天数', value: '5', unit: '天', tint: 'amber' },
];
