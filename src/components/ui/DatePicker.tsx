import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  formatCalendarDay,
  formatYearMonth,
  isSameCalendarDay,
  isWithinRange,
} from '@/domain/calendar';
import { radius, spacing, typography, useColors } from '@/theme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  today?: Date;
}

const TOUCH_TARGET = 44;

/** 完全由应用内组件绘制的月历，避免平台原生日期选择器破坏视觉一致性。 */
export function DatePicker({ value, onChange, minDate, maxDate, today }: DatePickerProps) {
  const colors = useColors();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const grid = useMemo(
    () => buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );

  const minMonth = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null;
  const maxMonth = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
  const canGoPrev = !minMonth || viewMonth.getTime() > minMonth.getTime();
  const canGoNext = !maxMonth || viewMonth.getTime() < maxMonth.getTime();

  function shiftMonth(delta: number) {
    if (delta < 0 && !canGoPrev) return;
    if (delta > 0 && !canGoNext) return;
    setViewMonth(addMonths(viewMonth, delta));
  }

  return (
    <View style={styles.root}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="上个月"
          accessibilityState={{ disabled: !canGoPrev }}
          disabled={!canGoPrev}
          onPress={() => shiftMonth(-1)}
          style={[styles.nav, { opacity: canGoPrev ? 1 : 0.35 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {formatYearMonth(viewMonth)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="下个月"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          onPress={() => shiftMonth(1)}
          style={[styles.nav, { opacity: canGoNext ? 1 : 0.35 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={[styles.weekday, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>

      {grid.map((week, index) => (
        <View key={`week-${index}`} style={styles.weekRow}>
          {week.map((cell) => {
            const selected = isSameCalendarDay(cell.date, value);
            const disabled = !cell.inMonth || !isWithinRange(cell.date, minDate, maxDate);
            const isToday = today ? isSameCalendarDay(cell.date, today) : false;

            return (
              <Pressable
                key={cell.key}
                accessibilityRole="button"
                accessibilityLabel={formatCalendarDay(cell.date)}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => onChange(cell.date)}
                style={[
                  styles.day,
                  {
                    backgroundColor: selected ? colors.primary : 'transparent',
                    borderColor: isToday && !selected ? colors.primary : 'transparent',
                    opacity: cell.inMonth ? 1 : 0.4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: selected
                        ? colors.onPrimary
                        : cell.inMonth
                          ? colors.text
                          : colors.faint,
                    },
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', gap: spacing.xs },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontSize: typography.subtitle, fontWeight: '700' },
  nav: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', gap: spacing.xs },
  weekday: { flex: 1, fontSize: typography.caption, textAlign: 'center' },
  day: {
    flex: 1,
    height: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontSize: typography.body, fontWeight: '600' },
});
