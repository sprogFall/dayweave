import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { findTool } from '@/domain/toolCatalog';
import type { MainStackParamList } from '@/navigation/types';
import { radius, spacing, typography, useColors } from '@/theme';

/** 工具详情页在大纲阶段只保留骨架，具体功能后续填充。 */
export function ToolPlaceholderScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'ToolDetail'>>();
  const tool = findTool(route.params.toolId);

  return (
    <Screen gradient={false}>
      <View style={styles.container}>
        <View style={styles.hero}>
          {tool ? <IconTile name={tool.icon} tint={tool.tint} size="lg" /> : null}
          <Text style={[styles.title, { color: colors.text }]}>功能开发中</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            「{tool?.title ?? '这个工具'}」的页面骨架先留白，具体功能会在后续版本补上。
          </Text>
        </View>

        <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.cardMuted }]}>
          <Ionicons name="construct-outline" size={18} color={colors.faint} />
          <Text style={[styles.placeholderText, { color: colors.faint }]}>工具内容稍后填充</Text>
        </View>

        <PrimaryButton label="返回" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.xl, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.md },
  title: { fontSize: typography.subtitle + 3, fontWeight: '700' },
  body: { fontSize: typography.body, lineHeight: 24, textAlign: 'center' },
  placeholder: {
    minHeight: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: { fontSize: typography.caption },
});
