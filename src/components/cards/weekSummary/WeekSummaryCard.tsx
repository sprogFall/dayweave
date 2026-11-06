import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CardShell } from '@/components/cards/CardShell';
import { CARD_META } from '@/components/cards/meta';
import type { CardViewProps } from '@/components/cards/types';
import { addDays, calendarDayKey, startOfDay } from '@/domain/calendar';
import { CARD_IDS } from '@/domain/cardLayout';
import { formatHours } from '@/domain/duration';
import { buildWeekSummary } from '@/domain/workStats';
import { useOpenTool } from '@/hooks/useOpenTool';
import { useWorkStore } from '@/stores/work.store';
import { spacing, typography, useColors } from '@/theme';

const BAR_HEIGHT = 64;
const MIN_BAR_HEIGHT = 6;

/** 与上周的差值文案；两边都没记录时不要硬说「持平」。 */
function deltaLabel(current: number, previous: number): string {
  if (current === 0 && previous === 0) return '这周还没有记录';
  if (previous === 0) return `比上周多 ${formatHours(current)} 小时`;

  const delta = current - previous;
  if (delta > 0) return `比上周多 ${formatHours(delta)} 小时`;
  if (delta < 0) return `比上周少 ${formatHours(-delta)} 小时`;
  return '与上周持平';
}

export function WeekSummaryCard({ edit }: CardViewProps) {
  const colors = useColors();
  const logs = useWorkStore((state) => state.logs);
  const openTool = useOpenTool();

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = calendarDayKey(today);
  const week = useMemo(() => buildWeekSummary(logs, today), [logs, today]);
  const previous = useMemo(() => buildWeekSummary(logs, addDays(today, -7)), [logs, today]);

  const peak = Math.max(...week.days.map((day) => day.minutes), 1);

  return (
    <CardShell
      title={CARD_META[CARD_IDS.weekSummary].title}
      actionLabel="详情"
      onAction={() => openTool('work-hours')}
      edit={edit}
    >
      <View style={styles.chart}>
        {week.days.map((day) => {
          const active = day.key === todayKey;
          const height = Math.max(MIN_BAR_HEIGHT, (day.minutes / peak) * BAR_HEIGHT);
          return (
            <View key={day.key} style={styles.column}>
              <Text style={[styles.hours, { color: active ? colors.primary : colors.faint }]}>
                {day.minutes > 0 ? formatHours(day.minutes) : ''}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: active ? colors.primary : colors.primarySoft,
                  },
                ]}
              />
              <Text style={[styles.day, { color: active ? colors.primary : colors.faint }]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.total, { color: colors.text }]}>
          {formatHours(week.totalMinutes)} 小时
        </Text>
        <Text style={[styles.delta, { color: colors.muted }]}>
          {deltaLabel(week.totalMinutes, previous.totalMinutes)}
        </Text>
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs + 2 },
  hours: { fontSize: 10, fontWeight: '600' },
  bar: { width: 14, borderRadius: 7 },
  day: { fontSize: typography.caption - 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  total: { fontSize: typography.subtitle, fontWeight: '800' },
  delta: { fontSize: typography.caption },
});
