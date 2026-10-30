import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useColors } from '@/theme';

export function SplashView() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}> 
      <View style={[styles.mark, { backgroundColor: colors.primary }]}>
        <Text style={[styles.markText, { color: colors.onPrimary }]}>DW</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>Dayweave</Text>
      <Text style={[styles.tagline, { color: colors.muted }]}>把今天，织成你想要的样子。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mark: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: typography.title, fontWeight: '800', letterSpacing: 1 },
  name: { marginTop: spacing.md, fontSize: typography.title, fontWeight: '800' },
  tagline: { fontSize: typography.body },
});
