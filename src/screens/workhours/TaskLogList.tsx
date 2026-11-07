import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseDayKey } from '@/domain/calendar';
import { formatDateLabel } from '@/domain/datetime';
import { formatDuration } from '@/domain/duration';
import { spacing, typography, useColors } from '@/theme';
import type { WorkLog } from '@/types/domain';

interface TaskLogListProps {
  logs: readonly WorkLog[];
  removingId: string | null;
  editingId: string | null;
  onEdit: (log: WorkLog) => void;
  onRemove: (log: WorkLog) => void;
}

function dayLabel(key: string): string {
  const date = parseDayKey(key);
  return date ? formatDateLabel(date) : key;
}

export function TaskLogList({
  logs,
  removingId,
  editingId,
  onEdit,
  onRemove,
}: TaskLogListProps) {
  const colors = useColors();

  if (logs.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.faint }]}>这个任务还没有工时记录。</Text>
    );
  }

  return (
    <View style={styles.list}>
      {logs.map((log) => {
        const label = dayLabel(log.date);
        const editing = editingId === log.id;

        return (
          <View
            key={log.id}
            style={[
              styles.row,
              { borderColor: editing ? colors.primary : colors.border },
            ]}
          >
            <View style={styles.copy}>
              <Text style={[styles.content, { color: colors.text }]} numberOfLines={2}>
                {log.content || '未填写内容'}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {label} · {formatDuration(log.minutes)}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`编辑 ${label} 的工时记录`}
              disabled={removingId === log.id}
              onPress={() => onEdit(log)}
              hitSlop={spacing.sm}
              style={styles.iconButton}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={editing ? colors.primary : colors.muted}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`删除 ${label} 的工时记录`}
              disabled={removingId === log.id}
              onPress={() => onRemove(log)}
              hitSlop={spacing.sm}
              style={styles.iconButton}
            >
              <Ionicons
                name="trash-outline"
                size={15}
                color={removingId === log.id ? colors.faint : colors.danger}
              />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, gap: 2 },
  content: { fontSize: typography.label, lineHeight: Math.round(typography.label * 1.4) },
  meta: { fontSize: typography.caption },
  iconButton: { padding: spacing.xs },
  empty: { fontSize: typography.caption },
});
