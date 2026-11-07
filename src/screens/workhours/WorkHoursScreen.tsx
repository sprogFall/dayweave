import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { calendarDayKey, startOfDay } from '@/domain/calendar';
import { formatDuration } from '@/domain/duration';
import { buildWeekSummary, groupLogsByTask, logsForTask, weekStartOf } from '@/domain/workStats';
import { isOverdue, sortTasks } from '@/domain/workTasks';
import { confirmAction, showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import type { MainStackParamList } from '@/navigation/types';
import { formatDateLabel } from '@/domain/datetime';
import { useWorkStore } from '@/stores/work.store';
import { spacing, typography, useColors } from '@/theme';
import type { WorkLog, WorkTask } from '@/types/domain';

import type { TaskLogDraft } from './TaskLogForm';
import { WorkTaskCard } from './WorkTaskCard';

export function WorkHoursScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const tasks = useWorkStore((state) => state.tasks);
  const logs = useWorkStore((state) => state.logs);
  const status = useWorkStore((state) => state.status);
  const loadError = useWorkStore((state) => state.error);
  const load = useWorkStore((state) => state.load);
  const setTaskDone = useWorkStore((state) => state.setTaskDone);
  const removeTask = useWorkStore((state) => state.removeTask);
  const addLog = useWorkStore((state) => state.addLog);
  const updateLog = useWorkStore((state) => state.updateLog);
  const removeLog = useWorkStore((state) => state.removeLog);

  const [removingLogId, setRemovingLogId] = useState<string | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = calendarDayKey(today);
  const week = useMemo(() => buildWeekSummary(logs, today), [logs, today]);
  const groups = useMemo(() => groupLogsByTask(logs), [logs]);
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  const openTasks = sorted.filter((task) => task.status === 'open');
  const doneTasks = sorted.filter((task) => task.status === 'done');
  const overdueCount = openTasks.filter((task) => isOverdue(task, todayKey)).length;

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleDone(task: WorkTask) {
    try {
      await setTaskDone(task.id, task.status !== 'done');
    } catch (error) {
      showMessage('更新失败', toUserMessage(error));
    }
  }

  async function handleRemoveTask(task: WorkTask) {
    const logCount = logsForTask(groups, task.id).length;
    const confirmed = await confirmAction({
      title: '删除任务？',
      message:
        logCount > 0
          ? `「${task.title}」和它下面的 ${logCount} 条工时记录都会删除。`
          : `「${task.title}」会被删除。`,
      confirmText: '删除',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await removeTask(task.id);
    } catch (error) {
      showMessage('删除失败', toUserMessage(error));
    }
  }

  async function handleRemoveLog(log: WorkLog) {
    const confirmed = await confirmAction({
      title: '删除这条工时记录？',
      message: `${formatDuration(log.minutes)} 会从任务的已用工时里扣掉。`,
      confirmText: '删除',
      destructive: true,
    });
    if (!confirmed) return;

    setRemovingLogId(log.id);
    try {
      await removeLog(log.id);
    } catch (error) {
      showMessage('删除失败', toUserMessage(error));
    } finally {
      setRemovingLogId(null);
    }
  }

  function renderTask(task: WorkTask) {
    return (
      <WorkTaskCard
        key={task.id}
        task={task}
        logs={logsForTask(groups, task.id)}
        todayKey={todayKey}
        removingLogId={removingLogId}
        onToggleDone={() => void handleToggleDone(task)}
        onEdit={() => navigation.navigate('WorkTaskEdit', { taskId: task.id })}
        onDelete={() => void handleRemoveTask(task)}
        onAddLog={(draft: TaskLogDraft) => addLog({ ...draft, taskId: task.id })}
        onUpdateLog={(id: string, draft: TaskLogDraft) =>
          updateLog(id, { ...draft, taskId: task.id })
        }
        onRemoveLog={(log) => void handleRemoveLog(log)}
      />
    );
  }

  if (status === 'loading' && tasks.length === 0) {
    return (
      <Screen gradient={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen gradient={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            本周 {formatDuration(week.totalMinutes)}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.muted }]}>
            {formatDateLabel(weekStartOf(today))}起 · {week.activeDays} 天有记录
          </Text>
          <Text style={[styles.summaryMeta, { color: overdueCount > 0 ? colors.danger : colors.muted }]}>
            进行中 {openTasks.length} 个任务
            {overdueCount > 0 ? ` · ${overdueCount} 个已逾期` : ''}
            {doneTasks.length > 0 ? ` · 已完成 ${doneTasks.length} 个` : ''}
          </Text>
        </Card>

        {status === 'error' ? (
          <Card style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {loadError ?? '读取工时数据失败，请稍后重试。'}
            </Text>
            <PrimaryButton label="重试" variant="ghost" onPress={() => void load({ force: true })} />
          </Card>
        ) : null}

        <PrimaryButton label="新建任务" onPress={() => navigation.navigate('WorkTaskEdit')} />

        {openTasks.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>进行中</Text>
            {openTasks.map(renderTask)}
          </View>
        ) : null}

        {doneTasks.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>已完成</Text>
            {doneTasks.map(renderTask)}
          </View>
        ) : null}

        {status === 'ready' && tasks.length === 0 ? (
          <Card style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              还没有任务。先建一个任务，再往它下面记工时。
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { gap: spacing.xs },
  summaryValue: { fontSize: typography.title, fontWeight: '800' },
  summaryMeta: { fontSize: typography.caption },
  errorCard: { gap: spacing.md },
  errorText: { fontSize: typography.label, lineHeight: Math.round(typography.label * 1.5) },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.subtitle, fontWeight: '700' },
  empty: { alignItems: 'center' },
  emptyText: { fontSize: typography.caption, textAlign: 'center', lineHeight: 20 },
});
