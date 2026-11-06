import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { UpdateCard } from '@/components/UpdateCard';
import { CardBoard } from '@/components/cards/CardBoard';
import { SharedIdentityCard } from '@/components/profile/SharedIdentityCard';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { confirmAction, showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth.store';
import { useCardLayoutStore } from '@/stores/cardLayout.store';
import { useWorkStore } from '@/stores/work.store';
import {
  spacing,
  typography,
  useColors,
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
  const signOut = useAuthStore((state) => state.signOut);
  const hydrateCards = useCardLayoutStore((state) => state.hydrate);
  const loadWork = useWorkStore((state) => state.load);
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void hydrateCards();
    void loadWork();
  }, [hydrateCards, loadWork]);

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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={[styles.title, { color: colors.text }]}>我的</Text>

        <SharedIdentityCard />

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
