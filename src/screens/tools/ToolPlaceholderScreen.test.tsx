import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToolPlaceholderScreen } from './ToolPlaceholderScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { toolId: 'work-hours' } }),
}));

describe('ToolPlaceholderScreen', () => {
  it('keeps the tool shell without implementing the tool', () => {
    render(<ToolPlaceholderScreen />);

    expect(screen.getByText('功能开发中')).toBeTruthy();
    expect(screen.getByText(/「工时记录」/)).toBeTruthy();
    expect(screen.getByText('工具内容稍后填充')).toBeTruthy();
  });

  it('goes back to the previous page', () => {
    render(<ToolPlaceholderScreen />);

    fireEvent.press(screen.getByLabelText('返回'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
