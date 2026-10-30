import type { IconName, TintName } from '@/theme';

export type ToolId =
  | 'work-hours'
  | 'schedule'
  | 'family-memo'
  | 'inventory'
  | 'habit'
  | 'travel';

export type ToolCategory = 'work' | 'life' | 'health' | 'travel';

export type ToolCategoryFilter = 'all' | ToolCategory;

export interface ToolDefinition {
  id: ToolId;
  title: string;
  summary: string;
  category: ToolCategory;
  icon: IconName;
  tint: TintName;
}

export const TOOL_CATALOG: readonly ToolDefinition[] = [
  {
    id: 'work-hours',
    title: '工时记录',
    summary: '按天登记工作时段，月底自动汇总。',
    category: 'work',
    icon: 'time-outline',
    tint: 'blue',
  },
  {
    id: 'schedule',
    title: '日程管理',
    summary: '把安排放进月历与时间轴。',
    category: 'work',
    icon: 'calendar-outline',
    tint: 'violet',
  },
  {
    id: 'family-memo',
    title: '家庭备忘录',
    summary: '家人共享的琐事与提醒。',
    category: 'life',
    icon: 'document-text-outline',
    tint: 'amber',
  },
  {
    id: 'inventory',
    title: '物品库存',
    summary: '家里的存量与过期提醒。',
    category: 'life',
    icon: 'cube-outline',
    tint: 'teal',
  },
  {
    id: 'habit',
    title: '习惯打卡',
    summary: '轻量记录每天的小坚持。',
    category: 'health',
    icon: 'leaf-outline',
    tint: 'mint',
  },
  {
    id: 'travel',
    title: '出行助手',
    summary: '行程清单与出发前检查。',
    category: 'travel',
    icon: 'airplane-outline',
    tint: 'rose',
  },
];

export const TOOL_CATEGORY_OPTIONS: readonly { value: ToolCategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'work', label: '工作' },
  { value: 'life', label: '生活' },
  { value: 'health', label: '健康' },
  { value: 'travel', label: '出行' },
];

/** 首页「常用工具」默认展示的工具，与工具页共用同一份目录。 */
export const DEFAULT_SHORTCUT_IDS: readonly ToolId[] = [
  'work-hours',
  'family-memo',
  'schedule',
  'travel',
];

export function findTool(id: string): ToolDefinition | undefined {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}

export const DEFAULT_SHORTCUTS: readonly ToolDefinition[] = DEFAULT_SHORTCUT_IDS.flatMap((id) => {
  const tool = findTool(id);
  return tool ? [tool] : [];
});

export function filterTools({
  category,
  keyword,
}: {
  category: ToolCategoryFilter;
  keyword: string;
}): ToolDefinition[] {
  const normalized = keyword.trim().toLowerCase();

  return TOOL_CATALOG.filter((tool) => {
    const matchesCategory = category === 'all' || tool.category === category;
    if (!matchesCategory || normalized.length === 0) return matchesCategory;
    return (
      tool.title.toLowerCase().includes(normalized) ||
      tool.summary.toLowerCase().includes(normalized)
    );
  });
}
