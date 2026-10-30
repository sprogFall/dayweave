import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { StatBlock } from '@/components/ui/StatBlock';
import { spacing, typography, useColors } from '@/theme';
import { TaskRow } from './TaskRow';
import {
  TASK_DONE,
  TASK_FILTER_OPTIONS,
  TASK_TOTAL,
  filterTaskGroups,
  type TaskFilter,
} from './tasks.data';

export function TasksScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const groups = useMemo(() => filterTaskGroups(filter), [filter]);
  const progress = Math.round((TASK_DONE / TASK_TOTAL) * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>待办</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            今天已经完成 {TASK_DONE} 项，继续加油。
          </Text>
        </View>

        <Card style={styles.summary}>
          <View style={styles.stats}>
            <StatBlock label="全部" value={String(TASK_TOTAL)} unit="项" tint="blue" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatBlock label="已完成" value={String(TASK_DONE)} unit="项" tint="mint" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatBlock
              label="待完成"
              value={String(TASK_TOTAL - TASK_DONE)}
              unit="项"
              tint="amber"
            />
          </View>

          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: colors.cardMuted }]}>
              <View
                style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.primary }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.faint }]}>{progress}%</Text>
          </View>
        </Card>

        <FilterChips options={TASK_FILTER_OPTIONS} value={filter} onChange={setFilter} />

        <View style={styles.groups}>
          {groups.map((group) => (
            <Card key={group.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>{group.title}</Text>
                <Text style={[styles.groupCount, { color: colors.faint }]}>
                  {group.tasks.length} 项
                </Text>
              </View>
              {group.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.caption },
  summary: { gap: spacing.lg },
  stats: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  divider: { width: 1, alignSelf: 'stretch', marginBottom: spacing.xs },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: typography.caption, fontWeight: '600' },
  groups: { gap: spacing.lg },
  group: { gap: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { fontSize: typography.body, fontWeight: '700' },
  groupCount: { fontSize: typography.caption },
});
