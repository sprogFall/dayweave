import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatBlock } from '@/components/ui/StatBlock';
import { spacing, typography, useColors } from '@/theme';
import type { OverviewStat } from './today.data';

interface OverviewCardProps {
  stats: readonly OverviewStat[];
  hint: string;
  onViewAll: () => void;
}

export function OverviewCard({ stats, hint, onViewAll }: OverviewCardProps) {
  const colors = useColors();

  return (
    <Card>
      <SectionHeader title="今日概览" actionLabel="查看全部" onAction={onViewAll} />

      <View style={styles.stats}>
        {stats.map((stat, index) => (
          <Fragment key={stat.id}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            <StatBlock label={stat.label} value={stat.value} unit={stat.unit} tint={stat.tint} />
          </Fragment>
        ))}
      </View>

      <View style={[styles.hint, { backgroundColor: colors.cardMuted }]}>
        <Ionicons name="sparkles" size={13} color={colors.primary} />
        <Text style={[styles.hintText, { color: colors.muted }]}>{hint}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  divider: { width: 1, alignSelf: 'stretch', marginBottom: spacing.xs },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.md,
  },
  hintText: { flex: 1, fontSize: typography.caption },
});
