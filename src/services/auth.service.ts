import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

function authErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return '邮箱或密码不正确。';
  if (normalized.includes('email not confirmed')) return '邮箱尚未验证，请先查收验证邮件。';
  if (normalized.includes('user already registered')) return '该邮箱已注册，请直接登录。';
  if (normalized.includes('password should be at least')) return '密码长度不符合要求。';
  return message || '认证失败，请稍后重试。';
}

export async function getInitialSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(authErrorMessage(error.message));
  return data.session;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(authErrorMessage(error.message));
}

export async function signUp(displayName: string, email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nickname: displayName.trim() } },
  });
  if (error) throw new Error(authErrorMessage(error.message));
  return Boolean(data.session);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(authErrorMessage(error.message));
}
