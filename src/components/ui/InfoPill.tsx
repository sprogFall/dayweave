import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';
import type { IconName } from '@/theme';

interface InfoPillProps {
  icon: IconName;
  label: string;
}

export function InfoPill({ icon, label }: InfoPillProps) {
  const colors = useColors();

  return (
    <View style={[styles.pill, { backgroundColor: colors.card }]}>
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
  },
  label: { fontSize: typography.caption, fontWeight: '600' },
});
