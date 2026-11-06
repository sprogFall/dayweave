import type { Family, FamilyMember, Profile } from '@/types/domain';

export const IDENTITY_TTL = 24 * 60 * 60 * 1000;
export const IDENTITY_STORAGE_KEY = 'identity:v1';

export interface IdentitySnapshot {
  version: 1;
  userId: string;
  profile: Profile;
  families: readonly Family[];
  members: Readonly<Record<string, readonly FamilyMember[]>>;
  fetchedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}
function isProfile(value: unknown, userId: string): value is Profile {
  return isRecord(value) && value.id === userId && typeof value.displayName === 'string' &&
    nullableString(value.avatarUrl) && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string';
}
function isFamily(value: unknown): value is Family {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    typeof value.ownerId === 'string' && typeof value.createdAt === 'string';
}
function isMember(value: unknown, familyId: string): value is FamilyMember {
  return isRecord(value) && value.familyId === familyId && typeof value.userId === 'string' &&
    (value.role === 'owner' || value.role === 'member') && typeof value.displayName === 'string' &&
    nullableString(value.avatarUrl);
}

/** 缓存不可信：按结构和账号完整验证，避免损坏数据或换号时展示别人的资料。 */
export function parseIdentityCache(raw: string | null, userId: string): IdentitySnapshot | null {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(value) || value.version !== 1 || value.userId !== userId ||
      typeof value.fetchedAt !== 'number' || !Number.isFinite(value.fetchedAt) ||
      !isProfile(value.profile, userId) || !Array.isArray(value.families) ||
      !value.families.every(isFamily) || !isRecord(value.members)) return null;
    const members = value.members;
    if (!value.families.every((family: Family) =>
      Array.isArray(members[family.id]) && (members[family.id] as unknown[]).every((member) => isMember(member, family.id)),
    )) return null;
    // 只保留当前家庭的成员，避免已退出家庭的多余缓存继续流入 UI。
    return {
      version: 1, userId, profile: value.profile, families: value.families,
      members: Object.fromEntries(value.families.map((family: Family) => [family.id, members[family.id] as FamilyMember[]])),
      fetchedAt: value.fetchedAt,
    };
  } catch {
    return null;
  }
}

export function isIdentityFresh(fetchedAt: number | null, now: number): boolean {
  return fetchedAt !== null && now >= fetchedAt && now - fetchedAt < IDENTITY_TTL;
}
