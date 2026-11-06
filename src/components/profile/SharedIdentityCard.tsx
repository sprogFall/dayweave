import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { toUserMessage } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';
import { spacing, typography, useColors } from '@/theme';

import { IdentityAvatar } from './IdentityAvatar';

export function SharedIdentityCard() {
  const colors = useColors();
  const email = useAuthStore((state) => state.session?.user.email) ?? '未绑定邮箱';
  const userId = useIdentityStore((state) => state.userId);
  const profile = useIdentityStore((state) => state.profile);
  const families = useIdentityStore((state) => state.families);
  const members = useIdentityStore((state) => state.members);
  const loading = useIdentityStore((state) => state.loading);
  const error = useIdentityStore((state) => state.error);
  const load = useIdentityStore((state) => state.load);
  const saveProfile = useIdentityStore((state) => state.saveProfile);
  const renameFamily = useIdentityStore((state) => state.renameFamily);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editingFamily, setEditingFamily] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const name = profile?.displayName.trim() || '未设置昵称';

  async function savePersonalDetails() {
    const url = avatarUrl.trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      setFormError('请填写 http 或 https 公开图片链接，或留空移除头像。');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await saveProfile({ displayName: displayName.trim(), avatarUrl: url || null });
      setEditingProfile(false);
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function saveFamilyName() {
    if (!editingFamily) return;
    if (!familyName.trim()) {
      setFormError('请填写家庭名称。');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await renameFamily(editingFamily, familyName.trim());
      setEditingFamily(null);
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.identity}>
        <IdentityAvatar name={name} avatarUrl={profile?.avatarUrl ?? null} label="我的头像" />
        <View style={styles.copy}>
          <Text style={[styles.heading, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.caption, { color: colors.muted }]}>{email}</Text>
        </View>
      </View>
      <Text style={[styles.caption, { color: colors.muted }]}>资料缓存一天，可手动刷新。</Text>
      {loading ? <Text style={[styles.caption, { color: colors.muted }]}>正在刷新共享资料…</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      <PrimaryButton
        label="刷新共享资料"
        variant="ghost"
        loading={loading}
        disabled={saving}
        onPress={() => {
          setFormError(null);
          void load({ force: true }).catch((cause: unknown) => setFormError(toUserMessage(cause)));
        }}
      />
      {editingProfile ? (
        <View style={styles.form}>
          <TextField label="昵称" accessibilityLabel="昵称" value={displayName} onChangeText={setDisplayName} editable={!saving} />
          <TextField
            label="头像 URL"
            accessibilityLabel="头像 URL"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!saving}
          />
          <Text style={[styles.caption, { color: colors.muted }]}>可填公开图片链接，留空可移除头像。</Text>
          <PrimaryButton label="保存个人资料" loading={saving} onPress={() => void savePersonalDetails()} />
          <PrimaryButton label="取消编辑个人资料" variant="ghost" disabled={saving} onPress={() => { setEditingProfile(false); setFormError(null); }} />
        </View>
      ) : (
        <PrimaryButton
          label="编辑个人资料"
          variant="ghost"
          disabled={!userId || loading || saving || editingFamily !== null}
          onPress={() => {
            setDisplayName(profile?.displayName ?? '');
            setAvatarUrl(profile?.avatarUrl ?? '');
            setFormError(null);
            setEditingProfile(true);
          }}
        />
      )}
      <Text style={[styles.heading, { color: colors.text }]}>共享家庭</Text>
      {!families.length ? (
        <Text style={[styles.caption, { color: colors.muted }]}>还没有共享家庭，前往 family-piggy 创建或加入即可。</Text>
      ) : families.map((family) => (
        <View key={family.id} style={[styles.family, { borderColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.text }]}>{family.name}</Text>
          {family.ownerId === userId ? (
            editingFamily === family.id ? (
              <View style={styles.form}>
                <TextField label="家庭名称" accessibilityLabel="家庭名称" value={familyName} onChangeText={setFamilyName} editable={!saving} />
                <PrimaryButton label="保存家庭名称" loading={saving} onPress={() => void saveFamilyName()} />
                <PrimaryButton label="取消修改家庭名称" variant="ghost" disabled={saving} onPress={() => { setEditingFamily(null); setFormError(null); }} />
              </View>
            ) : (
              <PrimaryButton
                label={`修改家庭名 ${family.name}`}
                variant="ghost"
                disabled={loading || saving || editingProfile || editingFamily !== null}
                onPress={() => { setEditingFamily(family.id); setFamilyName(family.name); setFormError(null); }}
              />
            )
          ) : null}
          {!members[family.id]?.length ? (
            <Text style={[styles.caption, { color: colors.muted }]}>暂无成员资料，可手动刷新。</Text>
          ) : members[family.id].map((member) => {
            const memberName = member.displayName.trim() || '未设置昵称';
            return (
              <View key={member.userId} style={styles.identity}>
                <IdentityAvatar name={memberName} avatarUrl={member.avatarUrl} label={`${memberName}的头像`} />
                <View style={styles.copy}>
                  <Text style={{ color: colors.text }}>{memberName}</Text>
                  <Text style={[styles.caption, { color: colors.muted }]}>{member.role === 'owner' ? '家庭所有者' : '家庭成员'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
      {formError ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{formError}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  heading: { fontSize: typography.subtitle, fontWeight: '700' },
  caption: { fontSize: typography.caption },
  form: { gap: spacing.md },
  family: { gap: spacing.md, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
