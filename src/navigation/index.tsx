import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/ui/TabIcon';
import { findTool } from '@/domain/toolCatalog';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ComponentGallery } from '@/screens/preview/ComponentGallery';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { TasksScreen } from '@/screens/tasks/TasksScreen';
import { TodayScreen } from '@/screens/today/TodayScreen';
import { ToolPlaceholderScreen } from '@/screens/tools/ToolPlaceholderScreen';
import { ToolsScreen } from '@/screens/tools/ToolsScreen';
import { useColors } from '@/theme';
import { getTabBarStyle, getTabBarTints, TAB_BAR_LABEL_STYLE } from './tabBar';
import type { AuthStackParamList, MainStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const TabStack = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<MainStackParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <TabStack.Navigator
      screenOptions={({ route }) => {
        const tints = getTabBarTints(colors);
        return {
          headerShown: false,
          tabBarActiveTintColor: tints.active,
          tabBarInactiveTintColor: tints.inactive,
          tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
          tabBarStyle: getTabBarStyle(colors, insets.bottom),
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        };
      }}
    >
      <TabStack.Screen name="Today" component={TodayScreen} options={{ title: '今天' }} />
      <TabStack.Screen name="Tools" component={ToolsScreen} options={{ title: '工具' }} />
      <TabStack.Screen name="Tasks" component={TasksScreen} options={{ title: '待办' }} />
      <TabStack.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
      {__DEV__ ? (
        <TabStack.Screen
          name="Gallery"
          component={ComponentGallery}
          options={{ title: '组件预览' }}
        />
      ) : null}
    </TabStack.Navigator>
  );
}

export function MainNavigator() {
  const colors = useColors();

  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ToolDetail"
        component={ToolPlaceholderScreen}
        options={({ route }) => ({
          title: findTool(route.params.toolId)?.title ?? '工具',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        })}
      />
    </RootStack.Navigator>
  );
}
