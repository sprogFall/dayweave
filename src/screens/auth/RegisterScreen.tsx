import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { validateDisplayName, validateEmail, validatePassword } from '@/domain/validation';
import { showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import type { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { spacing, typography, useColors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const colors = useColors();
  const signUp = useAuthStore((state) => state.signUp);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    displayName?: string | null;
    email?: string | null;
    password?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors = {
      displayName: validateDisplayName(displayName),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.displayName || nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      const hasSession = await signUp(displayName, email, password);
      if (!hasSession) {
        showMessage('验证邮件已发送', '请先前往邮箱完成验证，然后返回登录。');
        navigation.goBack();
      }
    } catch (error) {
      showMessage('注册失败', toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>CREATE ACCOUNT</Text>
          <Text style={[styles.title, { color: colors.text }]}>从今天开始织起</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            建立一个只属于你的生活空间。
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="昵称"
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            maxLength={24}
            placeholder="怎么称呼你？"
            textContentType="name"
          />
          <TextField
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            textContentType="emailAddress"
          />
          <TextField
            label="密码"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="至少 8 个字符"
            secureTextEntry
            textContentType="newPassword"
          />
          <PrimaryButton label="创建账号" onPress={() => void handleSubmit()} loading={submitting} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={[styles.footer, { color: colors.muted }]}>
            已有账号？<Text style={{ color: colors.primary, fontWeight: '700' }}>返回登录</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  header: { gap: spacing.sm },
  eyebrow: { fontSize: typography.caption, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: typography.hero, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 24 },
  form: { gap: spacing.lg },
  footer: { textAlign: 'center', fontSize: typography.body },
});
