import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/profile/IdentityAvatar';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { confirmAction } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';
import { spacing, typography, useColors } from '@/theme';
import type { Family } from '@/types/domain';

export function FamilyManagementScreen() {
  const colors = useColors();
  const userId = useIdentityStore((state) => state.userId);
  const families = useIdentityStore((state) => state.families);
  const members = useIdentityStore((state) => state.members);
  const currentFamilyId = useIdentityStore((state) => state.currentFamilyId);
  const loading = useIdentityStore((state) => state.loading);
  const error = useIdentityStore((state) => state.error);
  const load = useIdentityStore((state) => state.load);
  const setCurrentFamily = useIdentityStore((state) => state.setCurrentFamily);
  const renameFamily = useIdentityStore((state) => state.renameFamily);
  const joinFamily = useIdentityStore((state) => state.joinFamily);
  const leaveFamily = useIdentityStore((state) => state.leaveFamily);
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const disabled = busy || loading || !userId;

  useFocusEffect(useCallback(() => {
    void load().catch((cause: unknown) => setFormError(toUserMessage(cause)));
  }, [load]));

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await action();
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function join() {
    if (!code.trim()) { setFormError('请填写家庭邀请码。'); return; }
    void run(async () => { await joinFamily(code.trim()); setCode(''); });
  }

  function rename() {
    if (!editingId) return;
    if (!name.trim()) { setFormError('请填写家庭名称。'); return; }
    void run(async () => { await renameFamily(editingId, name.trim()); setEditingId(null); });
  }

  function leave(family: Family) {
    void run(async () => {
      const confirmed = await confirmAction({
        title: `退出「${family.name}」？`,
        message: 'Dayweave 和 family-piggy 将同步退出该家庭，不会删除历史账务。退出当前家庭后会切换到剩余的第一个家庭，没有其他家庭则不再设置当前家庭。',
        confirmText: '退出家庭',
        destructive: true,
      });
      // 确认框可能跨越账号切换，不能替换成新账号执行退出。
      if (confirmed && useIdentityStore.getState().userId === userId
        && useAuthStore.getState().session?.user.id === userId) await leaveFamily(family.id);
    });
  }

  return (
    <Screen gradient={false}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={[styles.caption, { color: colors.muted }]}>
          主家庭就是当前家庭，仅在本账号、本设备保存；首次默认选择第一个家庭。
        </Text>
        <PrimaryButton label="刷新家庭" variant="ghost" loading={loading} disabled={busy} onPress={() => void run(() => load({ force: true }))} />
        {loading ? <Text style={[styles.caption, { color: colors.muted }]}>正在加载家庭…</Text> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
        {formError ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{formError}</Text> : null}
        {!loading && !error && !families.length ? (
          <Text style={[styles.caption, { color: colors.muted }]}>还没有家庭，可使用邀请码加入；创建家庭请前往 family-piggy。</Text>
        ) : null}
        {families.map((family) => (
          <Card key={family.id} style={styles.card}>
            <Text style={[styles.heading, { color: colors.text }]}>{family.name}</Text>
            {family.id === currentFamilyId ? (
              <Text style={[styles.caption, { color: colors.primary }]}>当前家庭</Text>
            ) : (
              <PrimaryButton label={`设为当前家庭 ${family.name}`} variant="ghost" disabled={disabled} onPress={() => void run(() => setCurrentFamily(family.id))} />
            )}
            {!members[family.id]?.length ? (
              <Text style={[styles.caption, { color: colors.muted }]}>暂无成员资料，可手动刷新。</Text>
            ) : members[family.id].map((member) => {
              const memberName = member.displayName.trim() || '未设置昵称';
              return (
                <View key={member.userId} style={styles.member}>
                  <IdentityAvatar name={memberName} avatarUrl={member.avatarUrl} label={`${memberName}的头像`} />
                  <View style={styles.memberCopy}>
                    <Text style={[styles.body, { color: colors.text }]}>{memberName}</Text>
                    <Text style={[styles.caption, { color: colors.muted }]}>{member.role === 'owner' ? '家庭所有者' : '家庭成员'}</Text>
                  </View>
                </View>
              );
            })}
            {family.ownerId === userId ? (
              <>
                {editingId === family.id ? (
                  <View style={styles.card}>
                    <TextField label="家庭名称" accessibilityLabel="家庭名称" value={name} onChangeText={setName} editable={!disabled} />
                    <PrimaryButton label="保存家庭名称" disabled={disabled} onPress={rename} />
                    <PrimaryButton label="取消修改家庭名称" variant="ghost" disabled={busy} onPress={() => { setEditingId(null); setFormError(null); }} />
                  </View>
                ) : (
                  <PrimaryButton label={`修改家庭名 ${family.name}`} variant="ghost" disabled={disabled} onPress={() => { setEditingId(family.id); setName(family.name); setFormError(null); }} />
                )}
                <Text style={[styles.caption, { color: colors.muted }]}>家庭所有者不能直接退出；如需结束家庭，请在 family-piggy 处理，解散会影响账本。本页不提供解散操作。</Text>
              </>
            ) : (
              <PrimaryButton label={`退出家庭 ${family.name}`} variant="danger" disabled={disabled} onPress={() => leave(family)} />
            )}
          </Card>
        ))}
        <Card style={styles.card}>
          <Text style={[styles.heading, { color: colors.text }]}>通过邀请码加入</Text>
          <TextField label="家庭邀请码" accessibilityLabel="家庭邀请码" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} editable={!disabled} />
          <PrimaryButton label="加入家庭" disabled={disabled} onPress={join} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { gap: spacing.md },
  heading: { fontSize: typography.subtitle, fontWeight: '700' },
  body: { fontSize: typography.body },
  caption: { fontSize: typography.caption },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberCopy: { flex: 1, gap: spacing.xs },
});
