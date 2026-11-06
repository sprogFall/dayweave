import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { formatBytes, progressPercent, toDisplayNotes } from '@/domain/update';
import { useUpdateStore } from '@/stores/update.store';
import { radius, spacing, typography, useColors } from '@/theme';

interface LinkProps {
  label: string;
  text: string;
  onPress: () => void;
}

function Link({ label, text, onPress }: LinkProps) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.link}>
      <Text style={[styles.linkText, { color: colors.primary }]}>{text}</Text>
    </Pressable>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.action}>
      <PrimaryButton label={label} onPress={onPress} />
    </View>
  );
}

/** 「我的」页的应用更新卡片：不自动联网，由用户手动触发检查与下载。 */
export function UpdateCard() {
  const colors = useColors();
  const status = useUpdateStore((state) => state.status);
  const release = useUpdateStore((state) => state.release);
  const currentVersion = useUpdateStore((state) => state.currentVersion);
  const receivedBytes = useUpdateStore((state) => state.receivedBytes);
  const totalBytes = useUpdateStore((state) => state.totalBytes);
  const message = useUpdateStore((state) => state.message);
  const check = useUpdateStore((state) => state.check);
  const download = useUpdateStore((state) => state.download);
  const install = useUpdateStore((state) => state.install);
  const openInstallSettings = useUpdateStore((state) => state.openInstallSettings);
  const ignoreCurrent = useUpdateStore((state) => state.ignoreCurrent);

  const percent = progressPercent(receivedBytes, totalBytes);
  const version = release?.version ?? '';
  const bytesLabel = totalBytes === null ? '' : `（${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}）`;

  function renderBody() {
    if (status === 'checking') {
      return (
        <View style={styles.inline}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.hint, { color: colors.muted }]}>正在检查更新…</Text>
        </View>
      );
    }

    if (status === 'downloading') {
      const label = percent === null ? `正在下载安装包…${bytesLabel}` : `正在下载 ${percent}%${bytesLabel}`;
      const barStyle: StyleProp<ViewStyle> = { width: `${percent ?? 10}%` };
      return (
        <View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.bar, { backgroundColor: colors.primary }, barStyle]} />
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>{label}</Text>
        </View>
      );
    }

    if (status === 'ready') {
      return (
        <View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            安装包已下载完成，点击安装即可升级到 v{version}
          </Text>
          {message === null ? null : <Text style={[styles.warning, { color: colors.danger }]}>{message}</Text>}
          <Action label="安装" onPress={() => void install()} />
          {message === null ? null : (
            <Link
              label="去允许「安装未知应用」"
              text="去允许「安装未知应用」"
              onPress={() => void openInstallSettings()}
            />
          )}
        </View>
      );
    }

    if (status === 'available') {
      return (
        <View>
          <Text style={[styles.version, { color: colors.primary }]}>发现新版本 v{version}</Text>
          {release === null ? null : (
            <Text style={[styles.notes, { backgroundColor: colors.cardMuted, color: colors.muted }]}>
              {toDisplayNotes(release.notes)}
            </Text>
          )}
          <Action label="立即更新" onPress={() => void download()} />
          <Link label="忽略此版本" text="忽略此版本" onPress={() => void ignoreCurrent()} />
        </View>
      );
    }

    if (status === 'upToDate') {
      return (
        <View>
          <Text style={[styles.hint, { color: colors.muted }]}>已是最新版本，无需更新</Text>
          <Link label="重新检查" text="重新检查" onPress={() => void check({ force: true })} />
        </View>
      );
    }

    if (status === 'ignored') {
      return (
        <View>
          <Text style={[styles.hint, { color: colors.muted }]}>已忽略 v{version} 的更新提示</Text>
          <Link label="仍要查看" text="仍要查看" onPress={() => void check({ force: true })} />
        </View>
      );
    }

    if (status === 'unavailable' || status === 'failed') {
      const canRetryDownload = status === 'failed' && release !== null;
      return (
        <View>
          <Text style={[styles.warning, { color: colors.danger }]}>{message ?? '暂时无法检查更新'}</Text>
          <Action
            label={canRetryDownload ? '重试下载' : '重试'}
            onPress={() => void (canRetryDownload ? download() : check({ force: true }))}
          />
        </View>
      );
    }

    return (
      <View>
        <Text style={[styles.hint, { color: colors.muted }]}>检查是否有新版本可用</Text>
        <Action label="检查更新" onPress={() => void check()} />
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>应用更新</Text>
        <Text style={[styles.current, { color: colors.muted }]}>
          当前版本 v{currentVersion || '未知'}
        </Text>
      </View>
      {renderBody()}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.subtitle, fontWeight: '700' },
  current: { fontSize: typography.caption },
  hint: { fontSize: typography.label, lineHeight: Math.round(typography.label * 1.5) },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  action: { marginTop: spacing.sm },
  notes: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    fontSize: typography.label,
    lineHeight: Math.round(typography.label * 1.5),
  },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  bar: { height: 6, borderRadius: radius.pill },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontSize: typography.label, fontWeight: '600' },
  warning: { fontSize: typography.label, lineHeight: Math.round(typography.label * 1.5) },
  version: { fontSize: typography.subtitle, fontWeight: '700' },
});
