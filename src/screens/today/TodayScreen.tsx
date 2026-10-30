import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuthStore } from '@/stores/auth.store';
import { radius, spacing, typography, useColors } from '@/theme';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const STARTER_MODULES = [
  { title: '日程与提醒', body: '把重要的事放在看得见的地方。' },
  { title: '习惯与目标', body: '用轻量的记录，看见长期的变化。' },
  { title: '随记与灵感', body: '给稍纵即逝的想法留一个落点。' },
] as const;

function greetingFor(hour: number): string {
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function TodayScreen() {
  const colors = useColors();
  const user = useAuthStore((state) => state.session?.user);
  const displayName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    user?.email?.split('@')[0] ||
    '朋友';

  const today = useMemo(() => {
    const now = new Date();
    return {
      greeting: greetingFor(now.getHours()),
      date: `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEKDAYS[now.getDay()]}`,
    };
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>DAYWEAVE</Text>
            <Text style={[styles.date, { color: colors.muted }]}>{today.date}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {today.greeting}，{displayName}
          </Text>
          <Text style={[styles.heroText, { color: colors.muted }]}>
            把今天，织成你想要的样子。
          </Text>
        </View>

        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>今天</Text>
            <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>空白画布</Text>
            </View>
          </View>
          <Text style={[styles.cardBody, { color: colors.muted }]}>
            今天的页面还很安静。下一步，你可以从一件小事开始记录。
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardHint, { color: colors.muted }]}>
            当前版本已搭好账号、导航、主题与 Supabase 基础连接。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>接下来可以生长的地方</Text>
          <View style={styles.moduleList}>
            {STARTER_MODULES.map((module, index) => (
              <View
                key={module.title}
                style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.moduleIndex, { color: colors.accent }]}>
                  0{index + 1}
                </Text>
                <View style={styles.moduleCopy}>
                  <Text style={[styles.moduleTitle, { color: colors.text }]}>{module.title}</Text>
                  <Text style={[styles.moduleBody, { color: colors.muted }]}>{module.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: typography.caption, fontWeight: '800', letterSpacing: 1.8 },
  date: { marginTop: spacing.xs, fontSize: typography.caption },
  avatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.subtitle, fontWeight: '800' },
  hero: { gap: spacing.sm, paddingVertical: spacing.lg },
  greeting: { fontSize: typography.hero, fontWeight: '800', lineHeight: 38 },
  heroText: { fontSize: typography.body, lineHeight: 24 },
  todayCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: typography.subtitle, fontWeight: '800' },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  badgeText: { fontSize: typography.caption, fontWeight: '700' },
  cardBody: { fontSize: typography.body, lineHeight: 24 },
  divider: { height: 1, marginVertical: spacing.sm },
  cardHint: { fontSize: typography.caption, lineHeight: 20 },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.subtitle, fontWeight: '800' },
  moduleList: { gap: spacing.md },
  moduleCard: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  moduleIndex: { fontSize: typography.caption, fontWeight: '800', letterSpacing: 1 },
  moduleCopy: { flex: 1, gap: spacing.xs },
  moduleTitle: { fontSize: typography.body, fontWeight: '700' },
  moduleBody: { fontSize: typography.caption, lineHeight: 19 },
});
