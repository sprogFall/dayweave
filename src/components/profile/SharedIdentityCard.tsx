import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { DialogSheet } from '@/components/ui/DialogSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { toUserMessage } from '@/lib/errors';
import { uploadAvatar } from '@/services/avatar.service';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';
import { spacing, typography, useColors } from '@/theme';

import { IdentityAvatar } from './IdentityAvatar';

type Editor = 'name' | 'avatar' | 'url' | 'remove' | null;

export function SharedIdentityCard() {
  const colors = useColors();
  const email = useAuthStore((state) => state.session?.user.email) ?? '未绑定邮箱';
  const userId = useIdentityStore((state) => state.userId);
  const profile = useIdentityStore((state) => state.profile);
  const loading = useIdentityStore((state) => state.loading);
  const error = useIdentityStore((state) => state.error);
  const load = useIdentityStore((state) => state.load);
  const saveProfile = useIdentityStore((state) => state.saveProfile);
  const [editor, setEditor] = useState<Editor>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // ref 在 React 下一次渲染前也能阻止快速重复点击。
  const busy = useRef(false);
  const name = profile?.displayName.trim() || '未设置昵称';
  const disabled = loading || refreshing || saving;
  const activeUserId = useRef(userId);
  activeUserId.current = userId;
  useEffect(() => () => { activeUserId.current = null; }, []);

  function assertSameAccount(expected: string) {
    if (activeUserId.current !== expected) throw new Error('登录账号已变更，请重新选择头像。');
  }

  function open(next: Editor) {
    if (busy.current || disabled) return;
    setFormError(null);
    setDisplayName(profile?.displayName ?? '');
    setAvatarUrl(profile?.avatarUrl ?? '');
    setEditor(next);
  }

  function dismiss() {
    if (busy.current) return;
    setEditor(null);
    setFormError(null);
  }

  async function performSave(operation: () => Promise<boolean>) {
    if (busy.current || disabled) return;
    busy.current = true;
    setSaving(true);
    setFormError(null);
    try {
      if (await operation()) setEditor(null);
    } catch (cause) {
      setFormError(toUserMessage(cause, '修改头像失败，请稍后重试。'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function saveName() {
    void performSave(async () => {
      await saveProfile({ displayName: displayName.trim() });
      return true;
    });
  }

  function saveUrl() {
    const value = avatarUrl.trim();
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    } catch {
      setFormError('请填写有效的 http 或 https 公开图片链接。');
      return;
    }
    void performSave(async () => {
      await saveProfile({ avatarUrl: value });
      return true;
    });
  }

  function choosePhoto() {
    if (!userId) return;
    const sessionId = useAuthStore.getState().session?.user.id;
    const assertUploadAccount = () => {
      assertSameAccount(userId);
      if (useIdentityStore.getState().userId !== userId || useAuthStore.getState().session?.user.id !== sessionId) {
        throw new Error('登录账号已变更，请重新选择头像。');
      }
    };
    void performSave(async () => {
      let permission: ImagePicker.MediaLibraryPermissionResponse;
      try {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch {
        throw new Error('读取相册权限失败，请稍后重试。');
      }
      assertUploadAccount();
      if (!permission.granted) {
        setFormError('需要相册权限才能上传头像，请在系统设置中允许访问。');
        return false;
      }
      let selection: ImagePicker.ImagePickerResult;
      try {
        selection = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
      } catch {
        throw new Error('打开相册失败，请稍后重试。');
      }
      assertUploadAccount();
      if (selection.canceled) return false;
      const uri = selection.assets[0]?.uri;
      if (!uri) throw new Error('未能读取所选图片，请重新选择。');
      const url = await uploadAvatar(userId, uri, selection.assets[0]?.mimeType ?? 'image/jpeg');
      assertUploadAccount();
      await saveProfile({ avatarUrl: url });
      return true;
    });
  }

  async function refresh() {
    if (busy.current || disabled) return;
    busy.current = true;
    setRefreshing(true);
    setFormError(null);
    try {
      await load({ force: true });
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }

  const title = editor === 'name' ? '修改昵称' : editor === 'url' ? '编辑公开头像链接' : editor === 'remove' ? '移除头像？' : '更换头像';
  return (
    <Card style={styles.card}>
      <View style={styles.identity}>
        <Pressable accessibilityRole="button" accessibilityLabel="修改头像" accessibilityState={{ disabled: disabled || !userId }} disabled={disabled || !userId} hitSlop={spacing.sm} onPress={() => open('avatar')}>
          <IdentityAvatar name={name} avatarUrl={profile?.avatarUrl ?? null} label="我的头像" />
        </Pressable>
        <View style={styles.copy}>
          <Text style={[styles.heading, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.caption, { color: colors.muted }]}>{email}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="编辑个人资料" accessibilityState={{ disabled: disabled || !userId }} disabled={disabled || !userId} hitSlop={spacing.sm} style={styles.iconButton} onPress={() => open('name')}>
            <Ionicons name="create-outline" size={typography.subtitle} color={colors.muted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="刷新共享资料" accessibilityState={{ disabled }} disabled={disabled} hitSlop={spacing.sm} style={styles.iconButton} onPress={() => void refresh()}>
            {loading || refreshing ? <ActivityIndicator size="small" color={colors.muted} /> : <Ionicons name="refresh-outline" size={typography.subtitle} color={colors.muted} />}
          </Pressable>
        </View>
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      {formError && !editor ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{formError}</Text> : null}
      <DialogSheet visible={editor !== null} title={title} icon="person-outline" tint="mint" onDismiss={dismiss} actions={[]}>
        <View style={styles.form}>
          {editor === 'name' ? <>
            <TextField label="昵称" accessibilityLabel="昵称" value={displayName} onChangeText={setDisplayName} editable={!saving} />
            <PrimaryButton label="保存个人资料" loading={saving} onPress={saveName} />
          </> : null}
          {editor === 'avatar' ? <>
            <PrimaryButton label="从相册上传" loading={saving} onPress={choosePhoto} />
            <PrimaryButton label="编辑公开 URL" variant="ghost" disabled={saving} onPress={() => open('url')} />
            <PrimaryButton label="移除头像" variant="danger" disabled={saving || !profile?.avatarUrl} onPress={() => open('remove')} />
          </> : null}
          {editor === 'url' ? <>
            <TextField label="头像 URL" accessibilityLabel="头像 URL" value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!saving} />
            <PrimaryButton label="保存头像链接" loading={saving} onPress={saveUrl} />
          </> : null}
          {editor === 'remove' ? <>
            <Text style={{ color: colors.muted }}>移除后将显示昵称首字，其他应用中的共享头像也会更新。</Text>
            <PrimaryButton label="确认移除头像" variant="danger" loading={saving} onPress={() => void performSave(async () => { await saveProfile({ avatarUrl: null }); return true; })} />
          </> : null}
          {formError ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{formError}</Text> : null}
          <PrimaryButton label={editor === 'name' ? '取消编辑个人资料' : '取消'} variant="ghost" disabled={saving} onPress={dismiss} />
        </View>
      </DialogSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  heading: { fontSize: typography.subtitle, fontWeight: '700' },
  caption: { fontSize: typography.caption },
  actions: { flexDirection: 'row', gap: spacing.lg },
  iconButton: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.md },
});
