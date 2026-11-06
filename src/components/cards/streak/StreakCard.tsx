import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CardShell } from '@/components/cards/CardShell';
import { CARD_META } from '@/components/cards/meta';
import type { CardViewProps } from '@/components/cards/types';
import { calendarDayKey, startOfDay } from '@/domain/calendar';
import { CARD_IDS } from '@/domain/cardLayout';
import { countStreakDays } from '@/domain/workStats';
import { useOpenTool } from '@/hooks/useOpenTool';
import { useWorkStore } from '@/stores/work.store';
import { spacing, typography, useColors } from '@/theme';

function hintFor(streak: number, recordedToday: boolean): string {
  if (streak === 0) return '记录第一笔工时，连续天数就开始了。';
  if (recordedToday) return '今天已经记过，明天继续。';
  return '今天还没记，补上一笔就能续上。';
}

export function StreakCard({ edit }: CardViewProps) {
  const colors = useColors();
  const logs = useWorkStore((state) => state.logs);
  const openTool = useOpenTool();

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = calendarDayKey(today);
  const streak = useMemo(() => countStreakDays(logs, today), [logs, today]);
  const recordedToday = useMemo(
    () => logs.some((log) => log.date === todayKey),
    [logs, todayKey],
  );

  return (
    <CardShell
      title={CARD_META[CARD_IDS.streak].title}
      actionLabel="记录"
      onAction={() => openTool('work-hours')}
      edit={edit}
    >
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]}>{streak}</Text>
        <Text style={[styles.unit, { color: colors.faint }]}>天</Text>
        <Ionicons name="flame-outline" size={18} color={streak > 0 ? colors.accent : colors.faint} />
      </View>

      <Text style={[styles.hint, { color: colors.muted }]}>{hintFor(streak, recordedToday)}</Text>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  value: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: typography.label, marginBottom: 6 },
  hint: { fontSize: typography.caption, lineHeight: Math.round(typography.caption * 1.5) },
});
