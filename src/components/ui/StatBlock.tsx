import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useColors, useTints, type TintName } from '@/theme';

interface StatBlockProps {
  label: string;
  value: string;
  unit: string;
  tint: TintName;
}

export function StatBlock({ label, value, unit, tint }: StatBlockProps) {
  const colors = useColors();
  const tints = useTints();

  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: tints.fg[tint] }]} />
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.unit, { color: colors.faint }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1, gap: spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: typography.caption },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  value: { fontSize: 23, fontWeight: '700', letterSpacing: -0.5 },
  unit: { fontSize: typography.caption, marginBottom: 3 },
});
