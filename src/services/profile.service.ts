import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/domain';
import { toProfile, type ProfileRow } from '@/types/db';

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('dw_profiles')
    .select('id, display_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single<ProfileRow>();

  if (error) throw new Error('读取个人资料失败，请稍后重试。');
  return toProfile(data);
}

export async function updateMyProfile(
  userId: string,
  patch: { displayName?: string; avatarUrl?: string | null },
): Promise<Profile> {
  const update: Partial<Pick<ProfileRow, 'display_name' | 'avatar_url'>> = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName.trim();
  if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;

  const { data, error } = await supabase
    .from('dw_profiles')
    .update(update)
    .eq('id', userId)
    .select('id, display_name, avatar_url, created_at, updated_at')
    .single<ProfileRow>();

  if (error) throw new Error('保存个人资料失败，请稍后重试。');
  return toProfile(data);
}
