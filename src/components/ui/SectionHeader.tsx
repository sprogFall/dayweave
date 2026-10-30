import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useColors } from '@/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const colors = useColors();
  const showAction = Boolean(actionLabel && onAction);

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} ${actionLabel}`}
          onPress={onAction}
          hitSlop={spacing.sm}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: colors.muted }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.subtitle, fontWeight: '700' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: typography.caption },
});
