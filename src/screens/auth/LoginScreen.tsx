import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { validateEmail, validatePassword } from '@/domain/validation';
import { showMessage } from '@/lib/alert';
import { toUserMessage } from '@/lib/errors';
import type { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { radius, spacing, typography, useColors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const colors = useColors();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      showMessage('登录失败', toUserMessage(error));
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
        <View style={styles.brand}>
          <View style={[styles.mark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.markText, { color: colors.onPrimary }]}>DW</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>欢迎回到 Dayweave</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>登录后继续整理你的每一天。</Text>
        </View>

        <View style={styles.form}>
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
            autoComplete="current-password"
            placeholder="至少 8 个字符"
            secureTextEntry
            textContentType="password"
          />
          <PrimaryButton label="登录" onPress={() => void handleSubmit()} loading={submitting} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.footer, { color: colors.muted }]}>
            还没有账号？<Text style={{ color: colors.primary, fontWeight: '700' }}>创建账号</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  mark: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: typography.subtitle, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: spacing.md, fontSize: typography.title, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: typography.body, textAlign: 'center' },
  form: { gap: spacing.lg },
  footer: { textAlign: 'center', fontSize: typography.body },
});
