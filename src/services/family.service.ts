import { supabase } from '@/lib/supabase';
import type { Family, FamilyMember } from '@/types/domain';
import {
  toFamily, toFamilyMember,
  type FamilyMembershipRow, type FamilyMemberRow, type MemberProfileRow,
} from '@/types/db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(id: string, label: string): void {
  if (typeof id !== 'string' || !UUID.test(id)) throw new Error(`${label}标识无效。`);
}

export async function listMyFamilies(userId: string): Promise<Family[]> {
  validateId(userId, '用户');
  const { data, error } = await supabase
    .from('family_members')
    .select('families(id, name, owner_id, created_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .returns<FamilyMembershipRow[]>();

  if (error) throw new Error('读取家庭失败，请稍后重试。');
  // 家庭被共享 RLS 隐藏时，内嵌关系为 null，不尝试绕过权限回读。
  return (data ?? []).flatMap((row) => row.families ? [toFamily(row.families)] : []);
}

export async function listFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  validateId(familyId, '家庭');
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, user_id, role')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true })
    .returns<FamilyMemberRow[]>();

  if (error) throw new Error('读取家庭成员失败，请稍后重试。');
  const members = data ?? [];
  if (members.length === 0) return [];

  // user_id 的外键指向 auth.users，不存在可内嵌的 profiles 外键关系。
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .in('id', [...new Set(members.map((row) => row.user_id))])
    .returns<MemberProfileRow[]>();
  if (profileError) throw new Error('读取家庭成员失败，请稍后重试。');
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return members.map((row) => toFamilyMember(row, byId.get(row.user_id)));
}

export async function joinFamily(code: string): Promise<string> {
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{8}$/.test(normalized)) throw new Error('请输入 8 位家庭邀请码。');
  // 必须走邀请码 RPC，不直接 INSERT 成员，避免绕过加入校验。
  const { data, error } = await supabase.rpc('join_family', { p_code: normalized });
  if (error) {
    if (error.message === '邀请码不存在' || error.message === '你已在该家庭中') throw new Error(error.message);
    throw new Error('加入家庭失败，请稍后重试。');
  }
  if (typeof data !== 'string' || !UUID.test(data)) throw new Error('加入家庭失败，请刷新后重试。');
  return data;
}

export async function leaveFamily(familyId: string, userId: string): Promise<void> {
  validateId(familyId, '家庭');
  validateId(userId, '用户');
  const { data, error: lookupError } = await supabase.from('families')
    .select('owner_id').eq('id', familyId).single<{ owner_id: string }>();
  if (lookupError || !data) throw new Error('读取家庭信息失败，请刷新后重试。');
  if (data.owner_id === userId) throw new Error('家庭创建者不能退出，请先在 family-piggy 处理家庭归属。');
  // 只删除自己的成员关系；不删除家庭、账本或历史账务。
  const { error } = await supabase.from('family_members').delete()
    .eq('family_id', familyId).eq('user_id', userId);
  if (error) throw new Error('退出家庭失败，请稍后重试。');
}

export async function renameFamily(familyId: string, name: string): Promise<void> {
  validateId(familyId, '家庭');
  if (typeof name !== 'string' || !name.trim() || Array.from(name.trim()).length > 12) {
    throw new Error('家庭名称需 1-12 个字符。');
  }
  // owner 授权与家庭账本同步均交给既有 RPC，禁止直接写 families。
  const { error } = await supabase.rpc('rename_family', {
    p_family_id: familyId,
    p_name: name.trim(),
  });
  if (error) throw new Error('修改家庭名称失败，仅家庭创建者可修改，请稍后重试。');
}
