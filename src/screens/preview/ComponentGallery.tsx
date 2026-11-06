import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { formatCalendarDay } from '@/domain/calendar';
import { formatTime } from '@/domain/time';
import { confirmAction, showMessage } from '@/lib/alert';
import { pickDate, pickTime } from '@/lib/picker';
import { spacing, typography, useColors } from '@/theme';

/** 开发环境专用：集中验收统一弹窗、确认框、日历与时间选择器的外观与交互。 */
export function ComponentGallery() {
  const colors = useColors();
  const [result, setResult] = useState('尚未操作');

  async function openMessage() {
    await showMessage('统一消息弹窗', '所有提示都使用同一套圆角卡片与语义图标。');
    setResult('已关闭消息弹窗');
  }

  async function openConfirm() {
    const confirmed = await confirmAction({
      title: '删除这条记录？',
      message: '删除后无法恢复，请确认。',
      confirmText: '删除',
      destructive: true,
    });
    setResult(confirmed ? '已确认删除' : '已取消删除');
  }

  async function openDate() {
    const day = await pickDate({ title: '选择日期' });
    setResult(day ? `已选 ${formatCalendarDay(day)}` : '已取消日期选择');
  }

  async function openTime() {
    const time = await pickTime({ title: '选择时间' });
    setResult(time ? `已选 ${formatTime(time)}` : '已取消时间选择');
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>界面组件预览</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          仅开发环境可见，用于检查统一的弹窗与选择器样式。
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>弹窗与确认</Text>
          <PrimaryButton label="消息弹窗" onPress={() => void openMessage()} />
          <PrimaryButton
            label="确认框"
            variant="danger"
            onPress={() => void openConfirm()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>日期与时间</Text>
          <PrimaryButton
            label="选择日期"
            variant="ghost"
            onPress={() => void openDate()}
          />
          <PrimaryButton
            label="选择时间"
            variant="ghost"
            onPress={() => void openTime()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.caption, { color: colors.muted }]}>最近一次结果</Text>
          <Text style={[styles.result, { color: colors.primary }]}>{result}</Text>
        </Card>
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
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.caption, lineHeight: Math.round(typography.caption * 1.5) },
  card: { gap: spacing.md },
  sectionTitle: { fontSize: typography.subtitle, fontWeight: '700' },
  caption: { fontSize: typography.caption },
  result: { fontSize: typography.subtitle, fontWeight: '700' },
});
