import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  radius,
  spacing,
  typography,
  useCardShadow,
  useColors,
  type IconName,
  type TintName,
} from '@/theme';
import { IconTile } from './IconTile';
import { PrimaryButton } from './PrimaryButton';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
}

interface DialogSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  message?: string;
  icon: IconName;
  tint: TintName;
  onDismiss: () => void;
  actions: readonly DialogAction[];
}

const DIALOG_MAX_WIDTH = 360;
const ENTER_DURATION = 220;
const SHEET_TRAVEL = 24;

/** 所有应用内弹窗共用的容器：墨绿遮罩 + 白色圆角卡 + 顶部语义图标。 */
export function DialogSheet({
  visible,
  title,
  message,
  icon,
  tint,
  onDismiss,
  actions,
  children,
}: DialogSheetProps) {
  const colors = useColors();
  const shadow = useCardShadow();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    if (!visible) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 0 : ENTER_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible, reducedMotion, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_TRAVEL, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[styles.backdrop, { backgroundColor: colors.backdrop, opacity: progress }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="关闭弹窗"
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center} pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.card,
              shadow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: progress,
                transform: [{ translateY }],
              },
            ]}
          >
            <IconTile name={icon} tint={tint} size="lg" style={styles.icon} />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            {message ? (
              <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
            ) : null}
            {children ? <View style={styles.content}>{children}</View> : null}
            <View style={styles.actions}>
              {actions.map((action) => (
                <View key={action.label} style={styles.action}>
                  <PrimaryButton
                    label={action.label}
                    onPress={action.onPress}
                    variant={action.variant ?? 'primary'}
                  />
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: DIALOG_MAX_WIDTH,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: { alignSelf: 'center' },
  title: { fontSize: typography.subtitle, fontWeight: '800', textAlign: 'center' },
  message: {
    fontSize: typography.body,
    lineHeight: Math.round(typography.body * 1.5),
    textAlign: 'center',
  },
  content: { width: '100%' },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
  action: { flex: 1 },
});
