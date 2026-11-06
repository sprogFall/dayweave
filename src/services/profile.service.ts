import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/domain';
import { toProfile, type ProfileRow } from '@/types/db';

const COLUMNS = 'id, nickname, avatar_url, created_at, updated_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUserId(userId: string): void {
  if (typeof userId !== 'string' || !UUID.test(userId)) throw new Error('用户标识无效。');
}

export async function getMyProfile(userId: string): Promise<Profile> {
  validateUserId(userId);
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', userId)
    .single<ProfileRow>();

  if (error || !data) throw new Error('读取个人资料失败，请稍后重试。');
  return toProfile(data);
}

export async function updateMyProfile(
  userId: string,
  patch: { displayName?: string; avatarUrl?: string | null },
): Promise<Profile> {
  validateUserId(userId);
  if (!patch || (patch.displayName === undefined && patch.avatarUrl === undefined)) {
    throw new Error('请提供需要更新的个人资料。');
  }
  const update: Partial<Pick<ProfileRow, 'nickname' | 'avatar_url'>> = {};
  if (patch.displayName !== undefined) {
    if (typeof patch.displayName !== 'string' || !patch.displayName.trim() ||
        Array.from(patch.displayName.trim()).length > 50) {
      throw new Error('昵称需 1-50 个字符。');
    }
    update.nickname = patch.displayName.trim();
  }
  if (patch.avatarUrl !== undefined) {
    if (patch.avatarUrl !== null) {
      try {
        const url = new URL(patch.avatarUrl);
        if (typeof patch.avatarUrl !== 'string' || !['https:', 'http:'].includes(url.protocol) ||
            !url.hostname || url.username || url.password) throw new Error();
      } catch {
        throw new Error('头像地址无效，请使用 HTTP 或 HTTPS 地址。');
      }
    }
    update.avatar_url = patch.avatarUrl;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(COLUMNS)
    .single<ProfileRow>();

  if (error || !data) throw new Error('保存个人资料失败，请稍后重试。');
  return toProfile(data);
}
