import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { TodayScreen } from '@/screens/today/TodayScreen';
import { spacing, useColors } from '@/theme';
import type { AuthStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function MainNavigator() {
  const colors = useColors();

  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={route.name === 'Today' ? 'sunny-outline' : 'person-outline'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <MainTabs.Screen name="Today" component={TodayScreen} options={{ title: '今天' }} />
      <MainTabs.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </MainTabs.Navigator>
  );
}
