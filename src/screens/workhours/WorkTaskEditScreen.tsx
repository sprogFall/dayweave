import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { DurationField } from '@/components/ui/DurationField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { addDays, calendarDayKey, parseDayKey, startOfDay } from '@/domain/calendar';
import { formatDateLabel } from '@/domain/datetime';
import { toUserMessage } from '@/lib/errors';
import { pickDate } from '@/lib/picker';
import type { MainStackParamList } from '@/navigation/types';
import { useWorkStore } from '@/stores/work.store';
import { radius, spacing, typography, useColors } from '@/theme';
import type { WorkTask } from '@/types/domain';

const DEFAULT_SPAN_DAYS = 7;

interface DateRowProps {
  label: string;
  value: Date;
  onPress: () => void;
}

function DateRow({ label, value, onPress }: DateRowProps) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>{formatDateLabel(value)}</Text>
        <Ionicons name="calendar-outline" size={15} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/** 表单只在任务数据就绪后挂载，所以初始值可以直接从 props 取。 */
function TaskForm({ task }: { task: WorkTask | null }) {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const createTask = useWorkStore((state) => state.createTask);
  const updateTask = useWorkStore((state) => state.updateTask);

  const today = useMemo(() => startOfDay(new Date()), []);
  const defaultDue = useMemo(() => addDays(today, DEFAULT_SPAN_DAYS), [today]);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes ?? 0);
  const [startDate, setStartDate] = useState(
    () => (task ? (parseDayKey(task.startDate) ?? today) : today),
  );
  const [dueDate, setDueDate] = useState(
    () => (task ? (parseDayKey(task.dueDate) ?? defaultDue) : defaultDue),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePickStart() {
    const picked = await pickDate({ title: '选择开始日期', initial: startDate, max: dueDate });
    if (picked) setStartDate(startOfDay(picked));
  }

  async function handlePickDue() {
    const picked = await pickDate({ title: '选择截止日期', initial: dueDate, min: startDate });
    if (picked) setDueDate(startOfDay(picked));
  }

  async function handleSubmit() {
    if (title.trim().length === 0) {
      setError('请填写任务名。');
      return;
    }

    const startKey = calendarDayKey(startDate);
    const dueKey = calendarDayKey(dueDate);
    if (dueKey < startKey) {
      setError('截止日期不能早于开始日期。');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        estimatedMinutes,
        startDate: startKey,
        dueDate: dueKey,
      };

      if (task) await updateTask(task.id, input);
      else await createTask(input);

      navigation.goBack();
    } catch (submitError) {
      setError(toUserMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen gradient={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <TextField
            label="任务名"
            value={title}
            onChangeText={setTitle}
            placeholder="例如 重构工时模块"
            maxLength={60}
          />

          <TextField
            label="描述（可选）"
            value={description}
            onChangeText={setDescription}
            placeholder="补充背景、验收标准或参考链接"
            multiline
            maxLength={300}
            style={styles.textarea}
          />

          <DurationField
            label="预计工时"
            initialMinutes={task?.estimatedMinutes ?? 0}
            onChangeMinutes={setEstimatedMinutes}
          />

          <DateRow label="开始日期" value={startDate} onPress={() => void handlePickStart()} />
          <DateRow label="截止日期" value={dueDate} onPress={() => void handlePickDue()} />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <PrimaryButton
            label={task ? '保存' : '创建任务'}
            onPress={() => void handleSubmit()}
            loading={saving}
            disabled={saving}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

export function WorkTaskEditScreen() {
  const colors = useColors();
  const route = useRoute<RouteProp<MainStackParamList, 'WorkTaskEdit'>>();
  const taskId = route.params?.taskId ?? null;
  const tasks = useWorkStore((state) => state.tasks);
  const status = useWorkStore((state) => state.status);
  const load = useWorkStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  const existing = useMemo(
    () => (taskId ? (tasks.find((task) => task.id === taskId) ?? null) : null),
    [tasks, taskId],
  );

  // 编辑已有任务时要等 store 就绪，否则表单会用空值初始化。
  if (taskId && existing === null) {
    return (
      <Screen gradient={false}>
        <View style={styles.center}>
          {status === 'error' ? (
            <Text style={[styles.error, { color: colors.danger }]}>
              任务加载失败，请返回列表重试。
            </Text>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      </Screen>
    );
  }

  return <TaskForm key={existing?.id ?? 'new'} task={existing} />;
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { gap: spacing.lg },
  textarea: { minHeight: 92, paddingTop: spacing.md, textAlignVertical: 'top' },
  field: { gap: spacing.sm },
  fieldLabel: { fontSize: typography.caption, fontWeight: '700' },
  dateButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: typography.body },
  error: { fontSize: typography.caption },
});
