/** 语义化版本解析与比较；预发布或非法 tag 一律不推给正式版用户。 */

export interface AppVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly string[];
}

const VERSION_PATTERN = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const NUMERIC_PART = /^\d+$/;

export function parseAppVersion(raw: string): AppVersion | null {
  const matched = VERSION_PATTERN.exec(raw.trim().replace(/^[vV]/, ''));
  if (matched === null) return null;

  return {
    major: Number(matched[1]),
    minor: Number(matched[2] ?? 0),
    patch: Number(matched[3] ?? 0),
    prerelease: (matched[4] ?? '').split('.').filter((part) => part.length > 0),
  };
}

export function formatAppVersion(version: AppVersion): string {
  const core = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease.length > 0 ? `${core}-${version.prerelease.join('.')}` : core;
}

export function normalizeVersionTag(raw: string): string | null {
  const parsed = parseAppVersion(raw);
  return parsed === null ? null : formatAppVersion(parsed);
}

const compareIdentifier = (a: string, b: string): number => {
  if (a === b) return 0;
  const aNumeric = NUMERIC_PART.test(a);
  const bNumeric = NUMERIC_PART.test(b);
  if (aNumeric && bNumeric) return Number(a) > Number(b) ? 1 : -1;
  if (aNumeric) return -1;
  if (bNumeric) return 1;
  return a > b ? 1 : -1;
};

export function compareAppVersions(a: AppVersion, b: AppVersion): number {
  const cores: ReadonlyArray<readonly [number, number]> = [
    [a.major, b.major],
    [a.minor, b.minor],
    [a.patch, b.patch],
  ];
  for (const [left, right] of cores) {
    if (left !== right) return left > right ? 1 : -1;
  }

  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const left = a.prerelease[index];
    const right = b.prerelease[index];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    const diff = compareIdentifier(left, right);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const next = parseAppVersion(candidate);
  const installed = parseAppVersion(current);
  if (next === null || installed === null) return false;
  return compareAppVersions(next, installed) > 0;
}
