/**
 * 应用内更新：查 GitHub Release → 经镜像/代理下载 APK → 校验大小 → 拉起系统安装器。
 *
 * 仓库必须公开：私有仓库匿名调用 /releases/latest 只会得到 404，此时返回 null，
 * 界面展示「暂时无法检查更新」而不是报错。/releases/latest 天然排除草稿与预发布，
 * 手动触发的 build-<run> 体验包不会推给正式版用户。
 */

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { DEFAULT_PROXY_PREFIX, apkFileName, describeSizeProblem, resolveDownloadUrls } from '@/domain/update';
import type { AppRelease } from '@/types/domain';
import { toAppRelease, type GithubReleaseRow } from '@/types/github';

export const UPDATE_REPOSITORY = 'sprogFall/dayweave';
export const LATEST_RELEASE_URL = `https://api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest`;
/** App 私有目录：安装器通过 FileProvider 读取 */
export const UPDATE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}updates/`;
const REQUEST_TIMEOUT_MS = 30_000;

export interface DownloadProgress {
  received: number;
  total: number | null;
}

export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/** 当前安装版本（app.config.js 的 version，发布时由 tag 注入） */
export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '';
}

/** 留空即可禁用代理、只走直连；默认镜像用于国内网络访问 GitHub 资产。 */
export function getProxyPrefix(): string {
  return process.env.EXPO_PUBLIC_UPDATE_PROXY_PREFIX ?? DEFAULT_PROXY_PREFIX;
}

function packageName(): string {
  return Constants.expoConfig?.android?.package ?? '';
}

export async function downloadWithFallback(
  release: AppRelease,
  download: (url: string, report: (progress: DownloadProgress) => void) => Promise<string>,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string> {
  const urls = resolveDownloadUrls(release.apkUrl, release.mirrors, getProxyPrefix());
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      return await download(url, (progress) => onProgress?.(progress));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('安装包下载失败，请稍后重试');
}

async function fetchLatestReleaseRow(): Promise<GithubReleaseRow | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });

    if (response.status === 404) return null;
    if (response.status === 403) throw new Error('检查更新失败：GitHub 接口访问受限，请稍后再试');
    if (!response.ok) throw new Error(`检查更新失败（HTTP ${response.status}）`);

    const payload: unknown = await response.json();
    if (payload === null || typeof payload !== 'object') {
      throw new Error('检查更新失败：响应格式异常');
    }
    // GitHub 会持续增加字段，按宽松行类型解析后由 toAppRelease 逐字段校验。
    return payload as GithubReleaseRow;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLatestRelease(): Promise<AppRelease | null> {
  const row = await fetchLatestReleaseRow();
  return row === null ? null : toAppRelease(row);
}

async function ensureUpdateDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(UPDATE_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(UPDATE_DIRECTORY, { intermediates: true });
  }
}

/** 清掉历史安装包，避免每次更新在私有目录里堆积几十 MB。 */
export async function clearDownloadedApks(): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(UPDATE_DIRECTORY);
    await Promise.all(
      names
        .filter((name) => name.toLowerCase().endsWith('.apk'))
        .map((name) => FileSystem.deleteAsync(`${UPDATE_DIRECTORY}${name}`, { idempotent: true })),
    );
  } catch {
    // 目录尚不存在或读取失败都不阻塞本次下载
  }
}

/** 逐个候选地址重试；返回本地文件 URI。 */
export async function downloadApk(
  release: AppRelease,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string> {
  await ensureUpdateDirectory();
  await clearDownloadedApks();

  const fileUri = `${UPDATE_DIRECTORY}${apkFileName(release.version)}`;
  return downloadWithFallback(
    release,
    async (url, report) => {
      const resumable = FileSystem.createDownloadResumable(url, fileUri, {}, (snapshot) => {
        report({
          received: snapshot.totalBytesWritten,
          total: snapshot.totalBytesExpectedToWrite > 0 ? snapshot.totalBytesExpectedToWrite : null,
        });
      });
      const result = await resumable.downloadAsync();
      if (result === undefined || result === null) throw new Error('安装包下载中断，请重试');
      if (typeof result.status === 'number' && (result.status < 200 || result.status >= 300)) {
        throw new Error(`安装包下载失败（HTTP ${result.status}）`);
      }
      return result.uri;
    },
    onProgress,
  );
}

/** 校验文件大小；APK 是否被篡改由 Android 安装器的签名校验兜底。 */
export async function verifyDownloadedApk(release: AppRelease, uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) throw new Error('安装包不存在，请重新下载');

  const actualSize = typeof info.size === 'number' ? info.size : 0;
  const problem = describeSizeProblem(actualSize, release.apkSize);
  if (problem !== null) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    throw new Error(problem);
  }
}

export async function installApk(uri: string): Promise<void> {
  if (!isAndroid()) throw new Error('当前仅支持 Android 应用内更新');

  const contentUri = await FileSystem.getContentUriAsync(uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    // FLAG_GRANT_READ_URI_PERMISSION：让安装器能读取 FileProvider 暴露的文件
    flags: 1,
  });
}

/** 首次安装第三方 APK 需要先授予「安装未知应用」权限。 */
export async function openInstallPermissionSettings(): Promise<void> {
  if (!isAndroid()) return;
  await IntentLauncher.startActivityAsync('android.settings.MANAGE_UNKNOWN_APP_SOURCES', {
    data: `package:${packageName()}`,
  });
}
