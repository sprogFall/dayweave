import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CardShell } from '@/components/cards/CardShell';
import { CARD_META } from '@/components/cards/meta';
import type { CardViewProps } from '@/components/cards/types';
import { startOfDay } from '@/domain/calendar';
import { CARD_IDS } from '@/domain/cardLayout';
import { formatHours } from '@/domain/duration';
import { buildWeekSummary, minutesOn } from '@/domain/workStats';
import { useOpenTool } from '@/hooks/useOpenTool';
import { useWorkStore } from '@/stores/work.store';
import { spacing, typography, useColors } from '@/theme';

export function TodayHoursCard({ edit }: CardViewProps) {
  const colors = useColors();
  const logs = useWorkStore((state) => state.logs);
  const openTool = useOpenTool();

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayMinutes = useMemo(() => minutesOn(logs, today), [logs, today]);
  const week = useMemo(() => buildWeekSummary(logs, today), [logs, today]);

  const hint =
    todayMinutes > 0
      ? `本周已记录 ${formatHours(week.totalMinutes)} 小时 · ${week.activeDays} 天`
      : '今天还没有记录，点右上角记一笔。';

  return (
    <CardShell
      title={CARD_META[CARD_IDS.todayHours].title}
      actionLabel="记录"
      onAction={() => openTool('work-hours')}
      edit={edit}
    >
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]}>{formatHours(todayMinutes)}</Text>
        <Text style={[styles.unit, { color: colors.faint }]}>小时</Text>
      </View>

      <View style={[styles.hint, { backgroundColor: colors.cardMuted }]}>
        <Ionicons
          name={todayMinutes > 0 ? 'sparkles' : 'add-circle-outline'}
          size={13}
          color={colors.primary}
        />
        <Text style={[styles.hintText, { color: colors.muted }]}>{hint}</Text>
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  value: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: typography.label, marginBottom: 6 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.md,
  },
  hintText: { flex: 1, fontSize: typography.caption },
});
