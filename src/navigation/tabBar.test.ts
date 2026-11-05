import { LIGHT_COLORS } from '@/theme/palette';

import { getTabBarStyle, TAB_BAR_CONTENT_HEIGHT, TAB_BAR_LABEL_STYLE } from './tabBar';

/** 图标容器 28 + 上下内边距各 5 + 标签行高 14。 */
const REQUIRED_CONTENT_HEIGHT = 52;

describe('底部标签栏样式', () => {
  it('内容高度装得下图标与文字', () => {
    expect(TAB_BAR_CONTENT_HEIGHT).toBeGreaterThanOrEqual(REQUIRED_CONTENT_HEIGHT);
  });

  it('标签行高固定，不会被系统字体间距撑开', () => {
    expect(TAB_BAR_LABEL_STYLE.lineHeight).toBeGreaterThanOrEqual(TAB_BAR_LABEL_STYLE.fontSize ?? 0);
    expect(TAB_BAR_LABEL_STYLE.includeFontPadding).toBe(false);
  });

  it('高度叠加底部安全区，避免压到系统手势条', () => {
    const style = getTabBarStyle(LIGHT_COLORS, 34);

    expect(style.height).toBe(TAB_BAR_CONTENT_HEIGHT + 34);
    expect(style.backgroundColor).toBe(LIGHT_COLORS.card);
    expect(style.borderTopColor).toBe(LIGHT_COLORS.border);
  });
});
