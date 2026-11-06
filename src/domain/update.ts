/** 应用内更新的纯计算：代理地址、下载候选、Release 说明、进度与大小校验。 */

/** 国内访问 GitHub 资产常被限速，默认走镜像代理，失败再回退直连。 */
export const DEFAULT_PROXY_PREFIX = 'https://gh-proxy.com/';
export const RELEASE_NOTES_MAX_LINES = 12;
const APK_FILE_NAME = 'dayweave';
const MIRROR_LINE = /^\s*apk-mirror\s*[:：]\s*(\S+)\s*$/i;
const CHECKSUM_LINE = /^\s*sha256\s*[:：]\s*([0-9a-fA-F]{64})\s*$/i;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;
const BYTE_STEP = 1024;

function normalizePrefix(prefix: string): string | null {
  const trimmed = prefix.trim();
  if (trimmed.length === 0) return null;
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/** 只代理 GitHub 的 release 资产；其它地址与非法输入返回 null。 */
export function buildProxyUrl(url: string, prefix: string = DEFAULT_PROXY_PREFIX): string | null {
  const normalized = normalizePrefix(prefix);
  if (normalized === null) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.host !== 'github.com') return null;
  if (!parsed.pathname.includes('/releases/download/')) return null;
  return `${normalized}${parsed.toString()}`;
}

/** 优先级：Release 声明的镜像 → 代理 → 直连，去重且保持顺序。 */
export function resolveDownloadUrls(
  apkUrl: string,
  mirrors: readonly string[],
  prefix: string = DEFAULT_PROXY_PREFIX,
): string[] {
  const proxy = buildProxyUrl(apkUrl, prefix);
  const candidates = [...mirrors, ...(proxy === null ? [] : [proxy]), apkUrl];
  const seen = new Set<string>();
  return candidates.filter((url) => (seen.has(url) ? false : (seen.add(url), true)));
}

export function apkFileName(version: string): string {
  return `${APK_FILE_NAME}-${version || 'latest'}.apk`;
}

/** Release 说明里声明的下载镜像，仅接受 https 且去重。 */
export function extractApkMirrors(notes: string): string[] {
  const mirrors: string[] = [];
  for (const line of notes.split('\n')) {
    const matched = MIRROR_LINE.exec(line);
    if (matched === null) continue;
    let url: URL;
    try {
      url = new URL(matched[1]);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:') continue;
    const normalized = url.toString();
    if (!mirrors.includes(normalized)) mirrors.push(normalized);
  }
  return mirrors;
}

/** 展示用正文：去掉机器可读行与空行，过长时截断。 */
export function toDisplayNotes(notes: string): string {
  const lines = notes
    .split('\n')
    .filter((line) => !MIRROR_LINE.test(line) && !CHECKSUM_LINE.test(line))
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length <= RELEASE_NOTES_MAX_LINES) return lines.join('\n');
  return [...lines.slice(0, RELEASE_NOTES_MAX_LINES - 1), '…'].join('\n');
}

export function describeSizeProblem(actualSize: number, expectedSize: number | null): string | null {
  if (expectedSize !== null && actualSize !== expectedSize) {
    return '安装包大小与发布信息不一致，请重新下载';
  }
  return null;
}

export function progressPercent(received: number, total: number | null): number | null {
  if (total === null || total <= 0) return null;
  return Math.min(100, Math.round((received / total) * 100));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${BYTE_UNITS[0]}`;
  let value = bytes;
  let unit = 0;
  while (value >= BYTE_STEP && unit < BYTE_UNITS.length - 1) {
    value /= BYTE_STEP;
    unit += 1;
  }
  return unit === 0 ? `${Math.round(value)} ${BYTE_UNITS[unit]}` : `${value.toFixed(1)} ${BYTE_UNITS[unit]}`;
}
