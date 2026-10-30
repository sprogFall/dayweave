import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutGrid, toShortcutItems } from '@/components/ui/ShortcutGrid';
import {
  DEFAULT_SHORTCUTS,
  TOOL_CATEGORY_OPTIONS,
  filterTools,
  findTool,
  type ToolCategoryFilter,
} from '@/domain/toolCatalog';
import { showMessage } from '@/lib/alert';
import type { MainStackParamList } from '@/navigation/types';
import { radius, spacing, typography, useColors, usePrimaryGradient } from '@/theme';
import { ToolCard } from './ToolCard';

const SHORTCUTS = toShortcutItems(DEFAULT_SHORTCUTS);

export function ToolsScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const addGradient = usePrimaryGradient();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<ToolCategoryFilter>('all');

  const tools = useMemo(() => filterTools({ category, keyword }), [category, keyword]);

  function openTool(id: string) {
    const tool = findTool(id);
    if (!tool) return;
    navigation.navigate('ToolDetail', { toolId: tool.id });
  }

  function notifyPreview() {
    showMessage('还在路上', '这个入口会在后续版本开放。');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]}>工具</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              把每天要用的工具收在一起。
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="添加工具" onPress={notifyPreview}>
            <LinearGradient colors={addGradient} style={styles.addButton}>
              <Ionicons name="add" size={22} color={colors.onPrimary} />
            </LinearGradient>
          </Pressable>
        </View>

        <SearchBar value={keyword} onChangeText={setKeyword} placeholder="搜索工具名称" />

        <View style={styles.section}>
          <SectionHeader title="我的常用" actionLabel="管理" onAction={notifyPreview} />
          <ShortcutGrid items={SHORTCUTS} onSelect={openTool} />
        </View>

        <View style={styles.section}>
          <FilterChips options={TOOL_CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <View style={styles.list}>
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onPress={() => openTool(tool.id)} />
            ))}
            {tools.length === 0 ? (
              <Card style={styles.empty}>
                <Ionicons name="search-outline" size={20} color={colors.faint} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  没有找到匹配的工具，换个关键词试试。
                </Text>
              </Card>
            ) : null}
          </View>
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
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.caption },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.md },
  list: { gap: spacing.md },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyText: { flex: 1, fontSize: typography.caption },
});
