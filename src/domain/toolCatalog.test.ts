import {
  DEFAULT_SHORTCUT_IDS,
  TOOL_CATALOG,
  TOOL_CATEGORY_OPTIONS,
  filterTools,
  findTool,
} from './toolCatalog';

describe('toolCatalog', () => {
  it('keeps every tool id unique', () => {
    const ids = TOOL_CATALOG.map((tool) => tool.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('describes all tools with the fields the UI needs', () => {
    TOOL_CATALOG.forEach((tool) => {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.summary.length).toBeGreaterThan(0);
      expect(tool.icon.length).toBeGreaterThan(0);
    });
  });

  it('resolves a tool by id and returns undefined for unknown ids', () => {
    expect(findTool('work-hours')?.title).toBe('工时记录');
    expect(findTool('does-not-exist' as never)).toBeUndefined();
  });

  it('offers an 全部 option followed by every category', () => {
    expect(TOOL_CATEGORY_OPTIONS[0]).toEqual({ value: 'all', label: '全部' });
    expect(TOOL_CATEGORY_OPTIONS.map((option) => option.value)).toEqual([
      'all',
      'work',
      'life',
      'health',
      'travel',
    ]);
  });

  it('lists shortcuts that all exist in the catalog', () => {
    DEFAULT_SHORTCUT_IDS.forEach((id) => {
      expect(findTool(id)).toBeDefined();
    });
  });

  it('filters by category', () => {
    const workTools = filterTools({ category: 'work', keyword: '' });

    expect(workTools.length).toBeGreaterThan(0);
    expect(workTools.every((tool) => tool.category === 'work')).toBe(true);
  });

  it('filters by keyword against the title and summary, ignoring blank input', () => {
    expect(filterTools({ category: 'all', keyword: '   ' })).toHaveLength(TOOL_CATALOG.length);
    expect(
      filterTools({ category: 'all', keyword: '工时' }).map((tool) => tool.id),
    ).toEqual(['work-hours']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterTools({ category: 'all', keyword: '不存在的工具' })).toEqual([]);
  });

  it('combines keyword and category filters', () => {
    expect(filterTools({ category: 'life', keyword: '备忘' }).map((tool) => tool.id)).toEqual([
      'family-memo',
    ]);
    expect(filterTools({ category: 'travel', keyword: '备忘' })).toEqual([]);
  });
});
