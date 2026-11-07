import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToolPlaceholderScreen } from './ToolPlaceholderScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { toolId: 'work-hours' } }),
}));

describe('ToolPlaceholderScreen', () => {
  it('shows a single status line without dev notes', () => {
    render(<ToolPlaceholderScreen />);

    expect(screen.getByText('功能开发中')).toBeTruthy();
    expect(screen.queryByText(/骨架|稍后填充|准备中/)).toBeNull();
  });

  it('goes back to the previous page', () => {
    render(<ToolPlaceholderScreen />);

    fireEvent.press(screen.getByLabelText('返回'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
