import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDurationInput, splitMinutes } from '@/domain/duration';
import { radius, spacing, typography, useColors } from '@/theme';

interface DurationFieldProps {
  label: string;
  /** 仅作为初始值；组件自己维护输入文本，改动通过 onChangeMinutes 回传。 */
  initialMinutes: number;
  onChangeMinutes: (minutes: number) => void;
  error?: string | null;
}

/** 小时 + 分钟两段输入，避免让用户心算「480 分钟是几小时」。 */
export function DurationField({ label, initialMinutes, onChangeMinutes, error }: DurationFieldProps) {
  const colors = useColors();
  const initial = splitMinutes(initialMinutes);
  const [hoursText, setHoursText] = useState(initial.hours > 0 ? String(initial.hours) : '');
  const [minutesText, setMinutesText] = useState(
    initial.minutes > 0 ? String(initial.minutes) : '',
  );

  function update(nextHours: string, nextMinutes: string) {
    setHoursText(nextHours);
    setMinutesText(nextMinutes);
    onChangeMinutes(parseDurationInput(nextHours, nextMinutes) ?? 0);
  }

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.card, borderColor: error ? colors.danger : colors.border },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      <View style={styles.row}>
        <TextInput
          value={hoursText}
          onChangeText={(value) => update(value, minutesText)}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={colors.faint}
          accessibilityLabel={`${label} 小时`}
          style={inputStyle}
        />
        <Text style={[styles.unit, { color: colors.muted }]}>小时</Text>

        <TextInput
          value={minutesText}
          onChangeText={(value) => update(hoursText, value)}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
          placeholderTextColor={colors.faint}
          accessibilityLabel={`${label} 分钟`}
          style={inputStyle}
        />
        <Text style={[styles.unit, { color: colors.muted }]}>分钟</Text>
      </View>

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { fontSize: typography.caption, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    width: 64,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    textAlign: 'center',
  },
  unit: { fontSize: typography.caption },
  error: { fontSize: typography.caption },
});
