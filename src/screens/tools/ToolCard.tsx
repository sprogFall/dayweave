import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import type { ToolDefinition } from '@/domain/toolCatalog';
import { spacing, typography, useColors } from '@/theme';

interface ToolCardProps {
  tool: ToolDefinition;
  onPress: () => void;
}

export function ToolCard({ tool, onPress }: ToolCardProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tool.title}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={styles.card}>
        <IconTile name={tool.icon} tint={tool.tint} size="lg" />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>{tool.title}</Text>
          <Text style={[styles.summary, { color: colors.muted }]}>{tool.summary}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  copy: { flex: 1, gap: spacing.xs },
  title: { fontSize: typography.body, fontWeight: '700' },
  summary: { fontSize: typography.caption, lineHeight: 18 },
});
