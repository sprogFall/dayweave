import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DurationField } from '@/components/ui/DurationField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { calendarDayKey, startOfDay } from '@/domain/calendar';
import { formatDateLabel } from '@/domain/datetime';
import { pickDate } from '@/lib/picker';
import { radius, spacing, typography, useColors } from '@/theme';

export interface TaskLogDraft {
  content: string;
  minutes: number;
  date: string;
}

interface TaskLogFormProps {
  saving: boolean;
  error: string | null;
  onSubmit: (draft: TaskLogDraft) => void;
  onCancel: () => void;
}

/** 内联在任务卡里的记工时表单，不占独立页面也不额外压一个弹窗。 */
export function TaskLogForm({ saving, error, onSubmit, onCancel }: TaskLogFormProps) {
  const colors = useColors();
  const [content, setContent] = useState('');
  const [minutes, setMinutes] = useState(0);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [localError, setLocalError] = useState<string | null>(null);

  async function handlePickDate() {
    const picked = await pickDate({
      title: '选择工时归属日期',
      initial: date,
      max: startOfDay(new Date()),
    });
    if (picked) setDate(startOfDay(picked));
  }

  function handleSubmit() {
    if (content.trim().length === 0) {
      setLocalError('请填写这次做了什么。');
      return;
    }
    if (minutes <= 0) {
      setLocalError('花费时间需要大于 0。');
      return;
    }

    setLocalError(null);
    onSubmit({ content: content.trim(), minutes, date: calendarDayKey(date) });
  }

  const message = localError ?? error;

  return (
    <View style={[styles.form, { backgroundColor: colors.cardMuted }]}>
      <TextField
        label="工作内容"
        value={content}
        onChangeText={setContent}
        placeholder="这次做了什么"
        maxLength={120}
      />

      <DurationField label="花费时间" initialMinutes={0} onChangeMinutes={setMinutes} />

      <View style={styles.dateBlock}>
        <Text style={[styles.dateLabel, { color: colors.text }]}>归属日期</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="选择工时归属日期"
          onPress={() => void handlePickDate()}
          style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDateLabel(date)}</Text>
          <Ionicons name="calendar-outline" size={15} color={colors.muted} />
        </Pressable>
      </View>

      {message ? <Text style={[styles.error, { color: colors.danger }]}>{message}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <PrimaryButton label="取消" variant="ghost" onPress={onCancel} />
        </View>
        <View style={styles.action}>
          <PrimaryButton
            label="保存工时"
            onPress={handleSubmit}
            loading={saving}
            disabled={saving}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  dateBlock: { gap: spacing.sm },
  dateLabel: { fontSize: typography.caption, fontWeight: '700' },
  dateButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: typography.body },
  error: { fontSize: typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
