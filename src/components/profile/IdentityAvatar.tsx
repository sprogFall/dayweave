import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

interface IdentityAvatarProps {
  name: string;
  avatarUrl: string | null;
  label: string;
}

export function IdentityAvatar({ name, avatarUrl, label }: IdentityAvatarProps) {
  const colors = useColors();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (avatarUrl && avatarUrl !== failedUrl) {
    return (
      <Image
        accessibilityLabel={label}
        source={{ uri: avatarUrl }}
        style={styles.avatar}
        onError={() => setFailedUrl(avatarUrl)}
      />
    );
  }
  return (
    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
      <Text style={[styles.initial, { color: colors.onPrimary }]}>
        {Array.from(name.trim())[0]?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: spacing.xxl + spacing.xl,
    height: spacing.xxl + spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: typography.title, fontWeight: '800' },
});
