import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { confirmAction, showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import { getMyProfile } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth.store';
import { radius, spacing, typography, useColors } from '@/theme';

export function ProfileScreen() {
  const colors = useColors();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    getMyProfile(user.id)
      .then((profile) => {
        if (active) setDisplayName(profile.displayName);
      })
      .catch(() => {
        if (active) {
          setDisplayName((user.user_metadata?.display_name as string | undefined) ?? '');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user]);

  async function handleSignOut() {
    const confirmed = await confirmAction({
      title: '退出登录？',
      message: '本机保存的登录状态会被清除，之后可以重新登录。',
      confirmText: '退出',
      destructive: true,
    });
    if (!confirmed) return;

    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      showMessage('退出失败', toUserMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  const user = session?.user;
  const name = displayName || (user?.user_metadata?.display_name as string | undefined) || '未设置昵称';
  const email = user?.email ?? '未绑定邮箱';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>PROFILE</Text>
          <Text style={[styles.title, { color: colors.text }]}>我的</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {name.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.muted }]}>{email}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>账号状态</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>已登录</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>数据后端</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Supabase</Text>
          </View>
        </View>

        <PrimaryButton
          label="退出登录"
          variant="danger"
          onPress={() => void handleSignOut()}
          loading={signingOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  eyebrow: { fontSize: typography.caption, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: spacing.xs, fontSize: typography.hero, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  avatar: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.title, fontWeight: '800' },
  profileCopy: { flex: 1, gap: spacing.xs },
  name: { fontSize: typography.subtitle, fontWeight: '800' },
  email: { fontSize: typography.caption },
  infoCard: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  infoLabel: { fontSize: typography.body },
  infoValue: { fontSize: typography.body, fontWeight: '600' },
  divider: { height: 1 },
});
