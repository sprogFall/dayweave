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
  onRemove: (log: WorkLog) => void;
}

function dayLabel(key: string): string {
  const date = parseDayKey(key);
  return date ? formatDateLabel(date) : key;
}

export function TaskLogList({ logs, removingId, onRemove }: TaskLogListProps) {
  const colors = useColors();

  if (logs.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.faint }]}>这个任务还没有工时记录。</Text>
    );
  }

  return (
    <View style={styles.list}>
      {logs.map((log) => (
        <View key={log.id} style={[styles.row, { borderColor: colors.border }]}>
          <View style={styles.copy}>
            <Text style={[styles.content, { color: colors.text }]} numberOfLines={2}>
              {log.content || '未填写内容'}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {dayLabel(log.date)} · {formatDuration(log.minutes)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`删除 ${dayLabel(log.date)} 的工时记录`}
            disabled={removingId === log.id}
            onPress={() => onRemove(log)}
            hitSlop={spacing.sm}
            style={styles.remove}
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={removingId === log.id ? colors.faint : colors.danger}
            />
          </Pressable>
        </View>
      ))}
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
  remove: { padding: spacing.xs },
  empty: { fontSize: typography.caption },
});
