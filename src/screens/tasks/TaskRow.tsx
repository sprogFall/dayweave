import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useColors, useTints } from '@/theme';
import { TASK_TAG_LABELS, TASK_TAG_TINTS, type TaskItem } from './tasks.data';

interface TaskRowProps {
  task: TaskItem;
}

export function TaskRow({ task }: TaskRowProps) {
  const colors = useColors();
  const tints = useTints();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: task.done ? colors.primary : colors.border,
            backgroundColor: task.done ? colors.primary : 'transparent',
          },
        ]}
      >
        {task.done ? <Ionicons name="checkmark" size={12} color={colors.onPrimary} /> : null}
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            { color: task.done ? colors.faint : colors.text },
            task.done ? styles.titleDone : null,
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.tag, { backgroundColor: tints.bg[TASK_TAG_TINTS[task.tag]] }]}>
            <Text style={[styles.tagText, { color: tints.fg[TASK_TAG_TINTS[task.tag]] }]}>
              {TASK_TAG_LABELS[task.tag]}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.faint }]}>{task.time}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  copy: { flex: 1, gap: spacing.xs + 2 },
  title: { fontSize: typography.body, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 7 },
  tagText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: typography.caption },
});
