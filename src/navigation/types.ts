import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ToolId } from '@/domain/toolCatalog';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Tools: undefined;
  Tasks: undefined;
  Profile: undefined;
  /** 仅开发环境注册的组件预览页。 */
  Gallery: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ToolDetail: { toolId: ToolId };
  /** 工时记录已实现，不再走工具占位页。 */
  WorkHours: undefined;
  /** 新建任务不带参数；带 taskId 时为编辑。 */
  WorkTaskEdit: { taskId?: string } | undefined;
};
