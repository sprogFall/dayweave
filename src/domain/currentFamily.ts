export const CURRENT_FAMILY_STORAGE_KEY = 'identity:currentFamily:v1';

/** 主家庭仅在仍属于当前账号时保留；首次或退出后按服务顺序回退。 */
export function resolveCurrentFamily(
  preferredId: string | null,
  families: readonly { id: string }[],
): string | null {
  return families.some((family) => family.id === preferredId) ? preferredId : families[0]?.id ?? null;
}
