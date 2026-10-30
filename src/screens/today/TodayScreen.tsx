import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutGrid } from '@/components/ui/ShortcutGrid';
import { formatDateLabel, greetingFor } from '@/domain/datetime';
import { findTool } from '@/domain/toolCatalog';
import type { MainStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { spacing } from '@/theme';
import { GreetingHeader } from './GreetingHeader';
import { OverviewCard } from './OverviewCard';
import { WeekSummaryCard } from './WeekSummaryCard';
import {
  OVERVIEW_HINT,
  OVERVIEW_STATS,
  TODAY_SHORTCUTS,
  WEATHER_LABEL,
  WEEK_DELTA_HOURS,
  WEEK_LOGS,
  WEEK_TOTAL_HOURS,
} from './today.data';

export function TodayScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = useAuthStore((state) => state.session?.user);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    user?.email?.split('@')[0] ||
    '朋友';

  const now = useMemo(() => new Date(), []);
  const greeting = greetingFor(now.getHours());
  const dateLabel = formatDateLabel(now);
  const todayIndex = (now.getDay() + 6) % 7;

  function openTool(id: string) {
    const tool = findTool(id);
    if (!tool) return;
    navigation.navigate('ToolDetail', { toolId: tool.id });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GreetingHeader
          greeting={greeting}
          name={displayName}
          dateLabel={dateLabel}
          weather={WEATHER_LABEL}
        />

        <OverviewCard
          stats={OVERVIEW_STATS}
          hint={OVERVIEW_HINT}
          onViewAll={() => navigation.navigate('Tabs', { screen: 'Tasks' })}
        />

        <View style={styles.section}>
          <SectionHeader
            title="常用工具"
            actionLabel="全部"
            onAction={() => navigation.navigate('Tabs', { screen: 'Tools' })}
          />
          <ShortcutGrid items={TODAY_SHORTCUTS} onSelect={openTool} />
        </View>

        <WeekSummaryCard
          logs={WEEK_LOGS}
          totalHours={WEEK_TOTAL_HOURS}
          deltaHours={WEEK_DELTA_HOURS}
          todayIndex={todayIndex}
          onOpenDetail={() => openTool('work-hours')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.lg },
});
