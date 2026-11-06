import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { UpdateCard } from '@/components/UpdateCard';
import { CardBoard } from '@/components/cards/CardBoard';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { confirmAction, showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import { getMyProfile } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCardLayoutStore } from '@/stores/cardLayout.store';
import { useWorkStore } from '@/stores/work.store';
import {
  radius,
  spacing,
  typography,
  useColors,
  usePrimaryGradient,
  type IconName,
  type TintName,
} from '@/theme';

interface MenuEntry {
  id: string;
  label: string;
  icon: IconName;
  tint: TintName;
}

const MENU_ENTRIES: readonly MenuEntry[] = [
  { id: 'stats', label: '数据统计', icon: 'stats-chart-outline', tint: 'blue' },
  { id: 'tools', label: '工具管理', icon: 'grid-outline', tint: 'violet' },
  { id: 'notices', label: '消息通知', icon: 'notifications-outline', tint: 'amber' },
  { id: 'help', label: '帮助与反馈', icon: 'help-circle-outline', tint: 'teal' },
];

export function ProfileScreen() {
  const colors = useColors();
  const avatarGradient = usePrimaryGradient();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const hydrateCards = useCardLayoutStore((state) => state.hydrate);
  const loadWork = useWorkStore((state) => state.load);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void hydrateCards();
    void loadWork();
  }, [hydrateCards, loadWork]);

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

  function notifyPreview() {
    showMessage('还在路上', '这个页面会在后续版本开放。');
  }

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
  const name =
    displayName || (user?.user_metadata?.display_name as string | undefined) || '未设置昵称';
  const email = user?.email ?? '未绑定邮箱';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>我的</Text>

        <Card style={styles.profile}>
          <LinearGradient colors={avatarGradient} style={styles.avatar}>
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {name.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </LinearGradient>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.muted }]}>{email}</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader
            title="我的数据"
            actionLabel={editing ? '完成' : '配置'}
            onAction={() => setEditing((value) => !value)}
          />
          <CardBoard scope="profile" editing={editing} onRequestEdit={() => setEditing(true)} />
        </View>

        <Card padded={false} style={styles.menu}>
          {MENU_ENTRIES.map((entry, index) => (
            <View key={entry.id}>
              {index > 0 ? (
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={entry.label}
                onPress={notifyPreview}
                style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <IconTile name={entry.icon} tint={entry.tint} size="sm" />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{entry.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.faint} />
              </Pressable>
            </View>
          ))}
        </Card>

        <UpdateCard />

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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: { fontSize: typography.title, fontWeight: '800' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.subtitle + 3, fontWeight: '800' },
  profileCopy: { flex: 1, gap: spacing.xs },
  name: { fontSize: typography.subtitle, fontWeight: '700' },
  email: { fontSize: typography.caption },
  section: { gap: spacing.lg },
  menu: { overflow: 'hidden' },
  menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xl + 30 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  menuLabel: { flex: 1, fontSize: typography.body, fontWeight: '500' },
});
