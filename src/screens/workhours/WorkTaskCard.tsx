import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { parseDayKey } from '@/domain/calendar';
import { formatDateLabel } from '@/domain/datetime';
import { formatDuration } from '@/domain/duration';
import {
  TASK_STATUS_LABELS,
  isOverdue,
  progressPercent,
  taskProgress,
} from '@/domain/workTasks';
import { toUserMessage } from '@/lib/errors';
import { radius, spacing, typography, useColors } from '@/theme';
import type { WorkLog, WorkTask } from '@/types/domain';

import { TaskLogForm, type TaskLogDraft } from './TaskLogForm';
import { TaskLogList } from './TaskLogList';

interface ActionLinkProps {
  text: string;
  accessibilityLabel: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

function ActionLink({ text, accessibilityLabel, tone = 'default', onPress }: ActionLinkProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={spacing.xs}
      style={styles.actionLink}
    >
      <Text
        style={[
          styles.actionText,
          { color: tone === 'danger' ? colors.danger : colors.primary },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

interface WorkTaskCardProps {
  task: WorkTask;
  logs: readonly WorkLog[];
  todayKey: string;
  removingLogId: string | null;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLog: (draft: TaskLogDraft) => Promise<void>;
  onRemoveLog: (log: WorkLog) => void;
}

function dateRangeLabel(task: WorkTask): string {
  const start = parseDayKey(task.startDate);
  const due = parseDayKey(task.dueDate);
  return `${start ? formatDateLabel(start) : task.startDate} - ${due ? formatDateLabel(due) : task.dueDate}`;
}

export function WorkTaskCard({
  task,
  logs,
  todayKey,
  removingLogId,
  onToggleDone,
  onEdit,
  onDelete,
  onAddLog,
  onRemoveLog,
}: WorkTaskCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const progress = taskProgress(logs, task.id, task.estimatedMinutes);
  const overdue = isOverdue(task, todayKey);
  const done = task.status === 'done';

  async function handleAddLog(draft: TaskLogDraft) {
    setSavingLog(true);
    setLogError(null);
    try {
      await onAddLog(draft);
      setAdding(false);
    } catch (error) {
      setLogError(toUserMessage(error));
    } finally {
      setSavingLog(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? `收起 ${task.title}` : `展开 ${task.title}`}
        onPress={() => setExpanded((value) => !value)}
        style={styles.header}
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: done ? colors.cardMuted : colors.primarySoft },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: done ? colors.muted : colors.primary }]}
              >
                {TASK_STATUS_LABELS[task.status]}
              </Text>
            </View>
            {overdue ? (
              <View style={[styles.badge, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>已逾期</Text>
              </View>
            ) : null}
            <Text style={[styles.range, { color: colors.faint }]}>{dateRangeLabel(task)}</Text>
          </View>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.faint}
        />
      </Pressable>

      {task.description ? (
        <Text style={[styles.description, { color: colors.muted }]}>{task.description}</Text>
      ) : null}

      <View style={styles.progressHead}>
        <Text style={[styles.used, { color: colors.text }]}>
          已用 {formatDuration(progress.usedMinutes)}
        </Text>
        <Text style={[styles.estimate, { color: colors.muted }]}>
          {progress.estimatedMinutes > 0
            ? `预计 ${formatDuration(progress.estimatedMinutes)}`
            : '未估工时'}
        </Text>
      </View>

      {progress.estimatedMinutes > 0 ? (
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.bar,
              {
                width: `${progressPercent(progress.ratio)}%`,
                backgroundColor: progress.over ? colors.danger : colors.primary,
              },
            ]}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: progress.over ? colors.danger : colors.muted }]}>
          {progress.estimatedMinutes === 0
            ? `${logs.length} 条工时记录`
            : progress.over
              ? `超出预计 ${formatDuration(progress.usedMinutes - progress.estimatedMinutes)}`
              : `剩余 ${formatDuration(progress.remainingMinutes)}`}
        </Text>
      </View>

      {expanded ? (
        <View style={styles.detail}>
          <TaskLogList logs={logs} removingId={removingLogId} onRemove={onRemoveLog} />

          {adding ? (
            <TaskLogForm
              saving={savingLog}
              error={logError}
              onSubmit={(draft) => void handleAddLog(draft)}
              onCancel={() => {
                setAdding(false);
                setLogError(null);
              }}
            />
          ) : (
            <View style={styles.actions}>
              <ActionLink
                text="记一笔"
                accessibilityLabel={`为 ${task.title} 记一笔工时`}
                onPress={() => setAdding(true)}
              />
              <ActionLink
                text={done ? '重新打开' : '标记完成'}
                accessibilityLabel={done ? `重新打开 ${task.title}` : `完成 ${task.title}`}
                onPress={onToggleDone}
              />
              <ActionLink
                text="编辑"
                accessibilityLabel={`编辑 ${task.title}`}
                onPress={onEdit}
              />
              <ActionLink
                text="删除"
                accessibilityLabel={`删除任务 ${task.title}`}
                tone="danger"
                onPress={onDelete}
              />
            </View>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.sm },
  title: { fontSize: typography.body, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: typography.caption - 1, fontWeight: '700' },
  range: { fontSize: typography.caption - 1 },
  description: { fontSize: typography.caption, lineHeight: Math.round(typography.caption * 1.5) },
  progressHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  used: { fontSize: typography.label, fontWeight: '700' },
  estimate: { fontSize: typography.caption },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: 6, borderRadius: radius.pill },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
  footerText: { fontSize: typography.caption },
  detail: { gap: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionLink: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  actionText: { fontSize: typography.caption, fontWeight: '700' },
});
