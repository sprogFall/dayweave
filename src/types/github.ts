/**
 * GitHub Releases API 行类型与领域映射。
 * snake_case 只存在于这里的响应行类型，其余代码统一使用领域类型。
 * 仓库需公开：私有仓库匿名调用 /releases/latest 会得到 404。
 */

import { normalizeVersionTag } from '@/domain/app-version';
import { extractApkMirrors } from '@/domain/update';
import type { AppRelease } from '@/types/domain';

export interface GithubReleaseAssetRow {
  name?: string;
  browser_download_url?: string;
  size?: number;
}

export interface GithubReleaseRow {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GithubReleaseAssetRow[];
}

interface ApkAsset {
  url: string;
  size: number | null;
}

function findApkAsset(assets: readonly GithubReleaseAssetRow[]): ApkAsset | null {
  for (const asset of assets) {
    if (typeof asset.name !== 'string' || !asset.name.toLowerCase().endsWith('.apk')) continue;
    const url = asset.browser_download_url;
    if (typeof url !== 'string' || url.length === 0) continue;
    return { url, size: typeof asset.size === 'number' ? asset.size : null };
  }
  return null;
}

/** 草稿、无安装包、tag 不是版本号（如体验包 build-42）时返回 null。 */
export function toAppRelease(row: GithubReleaseRow): AppRelease | null {
  if (row.draft === true) return null;

  const tagName = (row.tag_name ?? '').trim();
  const version = normalizeVersionTag(tagName);
  if (version === null) return null;

  const pageUrl = (row.html_url ?? '').trim();
  if (pageUrl.length === 0) return null;

  const asset = findApkAsset(row.assets ?? []);
  if (asset === null) return null;

  const notes = row.body ?? '';
  return {
    tagName,
    version,
    title: (row.name ?? '').trim() || tagName,
    notes,
    pageUrl,
    apkUrl: asset.url,
    apkSize: asset.size,
    mirrors: extractApkMirrors(notes),
    publishedAt: row.published_at ?? null,
  };
}
