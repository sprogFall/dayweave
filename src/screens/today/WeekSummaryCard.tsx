import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { spacing, typography, useColors } from '@/theme';
import type { WeekLog } from './today.data';

interface WeekSummaryCardProps {
  logs: readonly WeekLog[];
  totalHours: number;
  deltaHours: number;
  todayIndex: number;
  onOpenDetail: () => void;
}

const BAR_HEIGHT = 64;
const MIN_BAR_HEIGHT = 6;

export function WeekSummaryCard({
  logs,
  totalHours,
  deltaHours,
  todayIndex,
  onOpenDetail,
}: WeekSummaryCardProps) {
  const colors = useColors();
  const peak = Math.max(...logs.map((log) => log.hours), 1);

  return (
    <Card>
      <SectionHeader title="本周小结" actionLabel="详情" onAction={onOpenDetail} />

      <View style={styles.chart}>
        {logs.map((log, index) => {
          const active = index === todayIndex;
          const height = Math.max(MIN_BAR_HEIGHT, (log.hours / peak) * BAR_HEIGHT);
          return (
            <View key={log.day} style={styles.column}>
              <Text style={[styles.hours, { color: active ? colors.primary : colors.faint }]}>
                {log.hours > 0 ? log.hours : ''}
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
                {log.day}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.total, { color: colors.text }]}>{totalHours} 小时</Text>
        <Text style={[styles.delta, { color: colors.muted }]}>
          比上周多 {deltaHours} 小时
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs + 2 },
  hours: { fontSize: 10, fontWeight: '600' },
  bar: { width: 14, borderRadius: 7 },
  day: { fontSize: typography.caption - 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  total: { fontSize: typography.subtitle, fontWeight: '800' },
  delta: { fontSize: typography.caption },
});
