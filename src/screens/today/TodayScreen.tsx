import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CardBoard } from '@/components/cards/CardBoard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutGrid, toShortcutItems } from '@/components/ui/ShortcutGrid';
import { formatDateLabel, greetingFor } from '@/domain/datetime';
import { DEFAULT_SHORTCUTS } from '@/domain/toolCatalog';
import { useOpenTool } from '@/hooks/useOpenTool';
import type { MainStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { useCardLayoutStore } from '@/stores/cardLayout.store';
import { useIdentityStore } from '@/stores/identity.store';
import { useWorkStore } from '@/stores/work.store';
import { spacing } from '@/theme';
import { GreetingHeader } from './GreetingHeader';

const TODAY_SHORTCUTS = toShortcutItems(DEFAULT_SHORTCUTS);

export function TodayScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const openTool = useOpenTool();
  const user = useAuthStore((state) => state.session?.user);
  const profile = useIdentityStore((state) => state.profile);
  const hydrateCards = useCardLayoutStore((state) => state.hydrate);
  const loadWork = useWorkStore((state) => state.load);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void hydrateCards();
    void loadWork();
  }, [hydrateCards, loadWork]);

  const displayName =
    profile?.displayName.trim() ||
    user?.email?.split('@')[0] ||
    '朋友';

  const now = useMemo(() => new Date(), []);
  const greeting = greetingFor(now.getHours());
  const dateLabel = formatDateLabel(now);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GreetingHeader greeting={greeting} name={displayName} dateLabel={dateLabel} />

        <View style={styles.section}>
          <SectionHeader
            title="我的卡片"
            actionLabel={editing ? '完成' : '配置'}
            onAction={() => setEditing((value) => !value)}
          />
          <CardBoard scope="today" editing={editing} onRequestEdit={() => setEditing(true)} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="常用工具"
            actionLabel="全部"
            onAction={() => navigation.navigate('Tabs', { screen: 'Tools' })}
          />
          <ShortcutGrid items={TODAY_SHORTCUTS} onSelect={openTool} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.lg },
});
