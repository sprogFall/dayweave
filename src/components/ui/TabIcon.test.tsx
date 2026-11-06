import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { LIGHT_TINTS, type TintName } from '@/theme/palette';
import { TabIcon } from './TabIcon';

const CASES: ReadonlyArray<[string, string, string, TintName]> = [
  ['Today', '今天', 'today', 'mint'],
  ['Tools', '工具', 'grid', 'blue'],
  ['Tasks', '待办', 'checkbox', 'amber'],
  ['Profile', '我的', 'person', 'violet'],
  ['Gallery', '组件预览', 'color-palette', 'teal'],
];

describe('TabIcon', () => {
  it.each(CASES)('%s has its own icon, label and tint', (name, label, icon, tint) => {
    render(<TabIcon name={name} focused />);

    expect(screen.getByLabelText(label)).toBeTruthy();
    expect(screen.getByLabelText(icon)).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByLabelText(label).props.style).backgroundColor).toBe(
      LIGHT_TINTS.bg[tint],
    );
  });

  it('uses the outline icon and a transparent tile when inactive', () => {
    render(<TabIcon name="Today" focused={false} />);

    expect(screen.getByLabelText('today-outline')).toBeTruthy();
    expect(screen.queryByLabelText('today')).toBeNull();
    expect(StyleSheet.flatten(screen.getByLabelText('今天').props.style).backgroundColor).toBe(
      'transparent',
    );
  });

  it('exposes the selected state for assistive technology', () => {
    render(<TabIcon name="Tasks" focused />);

    expect(screen.getByLabelText('待办').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('falls back to a neutral icon for an unknown route', () => {
    render(<TabIcon name="Unknown" focused />);

    expect(screen.getByLabelText('ellipse')).toBeTruthy();
  });
});
