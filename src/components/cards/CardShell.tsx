import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { spacing, typography, useColors } from '@/theme';
import type { CardEditActions } from './types';

interface CardShellProps extends PropsWithChildren {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 编辑态优先于操作链接，避免两套手势同时存在。 */
  edit?: CardEditActions | null;
}

interface EditButtonProps {
  icon: 'chevron-up' | 'chevron-down' | 'close';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function EditButton({ icon, label, disabled = false, onPress }: EditButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={[styles.editButton, { borderColor: colors.border, opacity: disabled ? 0.35 : 1 }]}
    >
      <Ionicons name={icon} size={14} color={colors.muted} />
    </Pressable>
  );
}

export function CardShell({ title, actionLabel, onAction, edit, children }: CardShellProps) {
  const colors = useColors();
  const showAction = Boolean(actionLabel && onAction);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {edit ? (
          <View style={styles.editRow}>
            <EditButton
              icon="chevron-up"
              label={`上移「${title}」`}
              disabled={!edit.canMoveUp}
              onPress={edit.onMoveUp}
            />
            <EditButton
              icon="chevron-down"
              label={`下移「${title}」`}
              disabled={!edit.canMoveDown}
              onPress={edit.onMoveDown}
            />
            <EditButton icon="close" label={`移除「${title}」`} onPress={edit.onRemove} />
          </View>
        ) : showAction ? (
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

      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.subtitle, fontWeight: '700' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: typography.caption },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  editButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
