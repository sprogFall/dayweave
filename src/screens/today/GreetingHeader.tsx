import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { InfoPill } from '@/components/ui/InfoPill';
import { radius, spacing, typography, useColors, usePrimaryGradient } from '@/theme';

interface GreetingHeaderProps {
  greeting: string;
  name: string;
  dateLabel: string;
  weather: string;
}

export function GreetingHeader({ greeting, name, dateLabel, weather }: GreetingHeaderProps) {
  const colors = useColors();
  const avatarGradient = usePrimaryGradient();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {greeting}，{name}
          </Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>今天也要元气满满！</Text>
        </View>
        <LinearGradient colors={avatarGradient} style={styles.avatar}>
          <Ionicons name="leaf" size={22} color={colors.onPrimary} />
        </LinearGradient>
      </View>

      <View style={styles.pills}>
        <InfoPill icon="calendar-outline" label={dateLabel} />
        <InfoPill icon="partly-sunny-outline" label={weather} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  copy: { flex: 1, gap: spacing.xs + 2 },
  greeting: { fontSize: typography.title, fontWeight: '800', letterSpacing: -0.4 },
  tagline: { fontSize: typography.body },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: { flexDirection: 'row', gap: spacing.sm },
});
