import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.dangerSoft : 'transparent';
  const foreground =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? colors.border : background,
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
