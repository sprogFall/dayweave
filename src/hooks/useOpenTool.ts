import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { findTool } from '@/domain/toolCatalog';
import type { MainStackParamList } from '@/navigation/types';

/**
 * 工具入口的唯一跳转点：已实现的工具进专属页面，其余仍落在占位页。
 * 新增一个真实工具时，只在这里加一条分支。
 */
export function useOpenTool(): (toolId: string) => void {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return useCallback(
    (toolId: string) => {
      const tool = findTool(toolId);
      if (!tool) return;

      if (tool.id === 'work-hours') {
        navigation.navigate('WorkHours');
        return;
      }

      navigation.navigate('ToolDetail', { toolId: tool.id });
    },
    [navigation],
  );
}
