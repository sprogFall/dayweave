import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ToolDefinition } from '@/domain/toolCatalog';
import { IconTile } from './IconTile';
import { spacing, typography, useColors, type IconName, type TintName } from '@/theme';

export interface ShortcutItem {
  id: string;
  title: string;
  icon: IconName;
  tint: TintName;
}

export function toShortcutItems(tools: readonly ToolDefinition[]): ShortcutItem[] {
  return tools.map((tool) => ({
    id: tool.id,
    title: tool.title,
    icon: tool.icon,
    tint: tool.tint,
  }));
}

interface ShortcutGridProps {
  items: readonly ShortcutItem[];
  onSelect: (id: string) => void;
}

export function ShortcutGrid({ items, onSelect }: ShortcutGridProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => onSelect(item.id)}
          style={styles.item}
        >
          <IconTile name={item.icon} tint={item.tint} size="md" />
          <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: spacing.sm },
  label: { fontSize: typography.caption, fontWeight: '600' },
});
