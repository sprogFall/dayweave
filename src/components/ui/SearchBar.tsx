import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const colors = useColors();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
      <Ionicons name="search-outline" size={18} color={colors.faint} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Ionicons
          name="close-circle"
          size={16}
          color={colors.faint}
          onPress={() => onChangeText('')}
          accessibilityLabel="清空搜索"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
  },
  input: { flex: 1, fontSize: typography.body, paddingVertical: spacing.md },
});
