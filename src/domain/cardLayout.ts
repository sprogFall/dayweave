/**
 * 卡片配置的纯规则：哪些卡片能放、顺序怎么变、脏数据怎么清。
 * 这里不认识 React，也不认识注册表，可用卡片列表由调用方传入。
 */

export const CARD_IDS = {
  todayHours: 'today-hours',
  weekSummary: 'week-summary',
  streak: 'streak',
} as const;

export type CardId = (typeof CARD_IDS)[keyof typeof CARD_IDS];

/** 卡片可以摆放的位置。同一个卡片允许同时出现在多页，但同页内不重复。 */
export type CardScope = 'today' | 'profile';

export const CARD_SCOPES: readonly CardScope[] = ['today', 'profile'];

/**
 * 每张卡片能出现在哪些页面。它是产品规则，所以放在 domain；
 * 组件层用 Record<CardId, ...> 注册实现，漏注册会被类型检查拦住。
 */
export const CARD_SCOPES_BY_ID: Record<CardId, readonly CardScope[]> = {
  [CARD_IDS.todayHours]: ['today', 'profile'],
  [CARD_IDS.weekSummary]: ['today', 'profile'],
  [CARD_IDS.streak]: ['today', 'profile'],
};

export const DEFAULT_CARD_IDS: Record<CardScope, readonly CardId[]> = {
  today: [CARD_IDS.todayHours, CARD_IDS.weekSummary],
  // 「我的」先讲坚持，再讲本周累计；和「今天」的默认顺序错开，两页不会长得一样。
  profile: [CARD_IDS.streak, CARD_IDS.weekSummary],
};

/** 某个页面可选的卡片，顺序同时决定配置面板里的排列顺序。 */
export function availableCardIds(scope: CardScope): CardId[] {
  return (Object.keys(CARD_SCOPES_BY_ID) as CardId[]).filter((id) =>
    CARD_SCOPES_BY_ID[id].includes(scope),
  );
}

export const CARD_STORAGE_KEY = 'cards:layout:v1';

export interface CardLayoutSnapshot {
  version: 1;
  today: readonly CardId[];
  profile: readonly CardId[];
}

/** 去掉已下线的卡片 id 与重复项，同时保留用户的原始顺序。 */
export function sanitizeCardIds(
  raw: readonly string[],
  available: readonly CardId[],
): CardId[] {
  const allowed = new Set<string>(available);
  const seen = new Set<string>();
  const result: CardId[] = [];

  raw.forEach((id) => {
    if (!allowed.has(id) || seen.has(id)) return;
    seen.add(id);
    result.push(id as CardId);
  });

  return result;
}

/**
 * 持久化数据 → 页面实际展示的列表。
 * 只有「从未配置过」（不是数组）才回落到默认值；空数组代表用户主动删光，必须尊重。
 */
export function resolveCardIds(
  raw: unknown,
  available: readonly CardId[],
  defaults: readonly CardId[],
): CardId[] {
  if (!Array.isArray(raw)) return [...defaults];
  return sanitizeCardIds(raw.filter((item): item is string => typeof item === 'string'), available);
}

export function toggleCardId(
  ids: readonly CardId[],
  id: CardId,
  available: readonly CardId[],
): CardId[] {
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  return sanitizeCardIds([...ids, id], available);
}

/** delta 为 -1 / 1；越界时原样返回，调用方不需要额外判断。 */
export function moveCardId(ids: readonly CardId[], id: CardId, delta: number): CardId[] {
  const index = ids.indexOf(id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= ids.length) return [...ids];

  const next = [...ids];
  next.splice(index, 1);
  next.splice(target, 0, id);
  return next;
}

export function toSnapshot(layouts: Record<CardScope, readonly CardId[]>): CardLayoutSnapshot {
  return { version: 1, today: layouts.today, profile: layouts.profile };
}

/** 解析失败一律返回 null，由 store 回落到默认布局，不让坏数据卡住页面。 */
export function parseSnapshot(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function readScope(snapshot: unknown, scope: CardScope): unknown {
  if (typeof snapshot !== 'object' || snapshot === null) return undefined;
  return (snapshot as Record<string, unknown>)[scope];
}
