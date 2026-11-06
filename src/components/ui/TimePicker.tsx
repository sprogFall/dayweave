import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  DEFAULT_MINUTE_STEP,
  formatTime,
  hourOptions,
  minuteOptions,
  pad2,
  type TimeValue,
} from '@/domain/time';
import { radius, spacing, typography, useColors } from '@/theme';

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  minuteStep?: number;
}

interface TimeColumnProps {
  heading: string;
  labelPrefix: string;
  options: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function TimeColumn({ heading, labelPrefix, options, selected, onSelect }: TimeColumnProps) {
  const colors = useColors();
  const initialOffset = Math.max(0, options.indexOf(selected)) * ITEM_HEIGHT;

  return (
    <View style={styles.column}>
      <Text style={[styles.columnLabel, { color: colors.muted }]}>{heading}</Text>
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: initialOffset }}
      >
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${labelPrefix} ${pad2(option)}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option)}
              style={[
                styles.option,
                { backgroundColor: active ? colors.primary : 'transparent' },
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  { color: active ? colors.onPrimary : colors.text },
                ]}
              >
                {pad2(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** 时 / 分两列滚动选择，分钟刻度可配置，不依赖平台原生时间滚轮。 */
export function TimePicker({ value, onChange, minuteStep = DEFAULT_MINUTE_STEP }: TimePickerProps) {
  const colors = useColors();
  const hours = useMemo(() => hourOptions(), []);
  const minutes = useMemo(() => minuteOptions(minuteStep), [minuteStep]);

  return (
    <View style={styles.root}>
      <View style={[styles.preview, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.previewLabel, { color: colors.primary }]}>
          {formatTime(value)}
        </Text>
      </View>
      <View style={styles.columns}>
        <TimeColumn
          heading="时"
          labelPrefix="小时"
          options={hours}
          selected={value.hour}
          onSelect={(hour) => onChange({ ...value, hour })}
        />
        <Text style={[styles.colon, { color: colors.faint }]}>:</Text>
        <TimeColumn
          heading="分"
          labelPrefix="分钟"
          options={minutes}
          selected={value.minute}
          onSelect={(minute) => onChange({ ...value, minute })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', gap: spacing.md },
  preview: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  previewLabel: { fontSize: typography.hero, fontWeight: '800', letterSpacing: 1 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, width: '100%' },
  column: { flex: 1 },
  columnLabel: { fontSize: typography.caption, textAlign: 'center', paddingBottom: spacing.sm },
  list: { width: '100%', height: ITEM_HEIGHT * VISIBLE_ITEMS },
  option: {
    height: ITEM_HEIGHT,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: typography.subtitle, fontWeight: '700' },
  colon: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    marginTop: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
  },
});
