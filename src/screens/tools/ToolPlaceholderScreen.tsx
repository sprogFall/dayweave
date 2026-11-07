import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { findTool } from '@/domain/toolCatalog';
import type { MainStackParamList } from '@/navigation/types';
import { spacing, typography, useColors } from '@/theme';

/** 尚未实现的工具只给一句状态，不暴露开发进度。 */
export function ToolPlaceholderScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'ToolDetail'>>();
  const tool = findTool(route.params.toolId);

  return (
    <Screen gradient={false}>
      <View style={styles.container}>
        {tool ? <IconTile name={tool.icon} tint={tool.tint} size="lg" /> : null}
        <Text style={[styles.title, { color: colors.text }]}>功能开发中</Text>

        <View style={styles.actions}>
          <PrimaryButton label="返回" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: typography.subtitle + 3, fontWeight: '700' },
  actions: { alignSelf: 'stretch', marginTop: spacing.md },
});
