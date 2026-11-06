import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { DEFAULT_PROXY_PREFIX } from '@/domain/update';
import type { AppRelease } from '@/types/domain';

import {
  LATEST_RELEASE_URL,
  downloadApk,
  downloadWithFallback,
  fetchLatestRelease,
  getProxyPrefix,
  installApk,
  openInstallPermissionSettings,
  verifyDownloadedApk,
} from './update.service';

const APK_URL = 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk';

const release: AppRelease = {
  tagName: 'v0.2.0',
  version: '0.2.0',
  title: 'Dayweave 0.2.0',
  notes: '说明',
  pageUrl: 'https://github.com/sprogFall/dayweave/releases/tag/v0.2.0',
  apkUrl: APK_URL,
  apkSize: 123,
  mirrors: [],
  publishedAt: null,
};

const row = {
  tag_name: 'v0.2.0',
  html_url: release.pageUrl,
  body: '说明',
  assets: [{ name: 'dayweave-v0.2.0.apk', browser_download_url: APK_URL, size: 123 }],
};

const fileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const originalOS = Platform.OS;

function setOS(value: string) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value });
}

function mockFetch(impl: jest.Mock) {
  global.fetch = impl as unknown as typeof fetch;
}

beforeEach(() => {
  jest.clearAllMocks();
  setOS('android');
  fileSystem.getInfoAsync.mockImplementation(async (uri: string) =>
    uri.endsWith('updates/')
      ? { exists: false, uri, isDirectory: false }
      : { exists: true, uri, size: 123, isDirectory: false, modificationTime: 0 },
  );
  fileSystem.createDownloadResumable.mockReturnValue({
    downloadAsync: jest.fn(async () => ({ status: 200, uri: 'file:///docs/updates/a.apk' })),
  } as unknown as ReturnType<typeof FileSystem.createDownloadResumable>);
});

afterEach(() => {
  setOS(originalOS);
});

describe('update.service 配置', () => {
  it('读取当前安装版本与默认代理前缀（自定义前缀由 buildProxyUrl 覆盖）', () => {
    expect(Constants.expoConfig?.version).toBe('0.2.0');
    expect(getProxyPrefix()).toBe(DEFAULT_PROXY_PREFIX);
  });
});

describe('fetchLatestRelease', () => {
  it('请求公开仓库的最新正式版并映射为领域对象', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => row });
    mockFetch(fetchMock);

    const result = await fetchLatestRelease();

    expect(fetchMock).toHaveBeenCalledWith(LATEST_RELEASE_URL, expect.objectContaining({ signal: expect.anything() }));
    expect(result).toMatchObject({ version: '0.2.0', apkUrl: APK_URL, apkSize: 123 });
  });

  it('404（私有仓库 / 尚无 Release）视为暂时拿不到', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));
    await expect(fetchLatestRelease()).resolves.toBeNull();
  });

  it('限流与其它错误抛出可读中文文案', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }));
    await expect(fetchLatestRelease()).rejects.toThrow('GitHub 接口访问受限');

    mockFetch(jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(fetchLatestRelease()).rejects.toThrow('检查更新失败（HTTP 500）');
  });

  it('响应格式异常时报错，体验包 tag 不提示更新', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => null }));
    await expect(fetchLatestRelease()).rejects.toThrow('响应格式异常');

    mockFetch(jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ...row, tag_name: 'build-42' }) }));
    await expect(fetchLatestRelease()).resolves.toBeNull();
  });
});

describe('downloadWithFallback', () => {
  it('代理失败后回退直连，并透传进度', async () => {
    const tried: string[] = [];
    const progress: number[] = [];

    const uri = await downloadWithFallback(
      release,
      async (url, report) => {
        tried.push(url);
        report({ received: 10, total: 100 });
        if (tried.length === 1) throw new Error('代理不可用');
        return 'file:///docs/updates/a.apk';
      },
      (state) => progress.push(state.received),
    );

    expect(uri).toBe('file:///docs/updates/a.apk');
    expect(tried).toEqual([`${DEFAULT_PROXY_PREFIX}${APK_URL}`, APK_URL]);
    expect(progress).toEqual([10, 10]);
  });

  it('全部失败时抛出最后一个错误', async () => {
    await expect(
      downloadWithFallback(release, async (url) => {
        throw new Error(`失败于 ${url}`);
      }),
    ).rejects.toThrow(`失败于 ${APK_URL}`);
  });
});

describe('downloadApk 与校验', () => {
  it('下载到私有目录并清掉历史安装包', async () => {
    fileSystem.readDirectoryAsync.mockResolvedValue(['old.apk', 'notes.txt']);

    const uri = await downloadApk(release);

    expect(fileSystem.makeDirectoryAsync).toHaveBeenCalled();
    expect(fileSystem.deleteAsync).toHaveBeenCalledWith(expect.stringContaining('old.apk'), { idempotent: true });
    expect(uri).toBe('file:///docs/updates/a.apk');
  });

  it('下载结果非 2xx 时报错', async () => {
    fileSystem.createDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn(async () => ({ status: 404, uri: 'file:///docs/updates/a.apk' })),
    } as unknown as ReturnType<typeof FileSystem.createDownloadResumable>);

    await expect(downloadApk(release)).rejects.toThrow('安装包下载失败');
  });

  it('大小一致时通过，不一致时删除文件并提示', async () => {
    await expect(verifyDownloadedApk(release, 'file:///docs/updates/a.apk')).resolves.toBeUndefined();

    fileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: 'file:///docs/updates/a.apk',
      size: 100,
      isDirectory: false,
      modificationTime: 0,
    });
    await expect(verifyDownloadedApk(release, 'file:///docs/updates/a.apk')).rejects.toThrow('大小与发布信息不一致');
    expect(fileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('文件不存在或发布方未给大小时不阻塞安装', async () => {
    fileSystem.getInfoAsync.mockResolvedValue({ exists: false, uri: '', isDirectory: false });
    await expect(verifyDownloadedApk(release, 'file:///docs/updates/a.apk')).rejects.toThrow('安装包不存在');

    fileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: 'file:///docs/updates/a.apk',
      size: 999,
      isDirectory: false,
      modificationTime: 0,
    });
    await expect(verifyDownloadedApk({ ...release, apkSize: null }, 'file:///docs/updates/a.apk')).resolves.toBeUndefined();
  });
});

describe('安装', () => {
  it('Android 下通过 FileProvider 拉起系统安装器', async () => {
    fileSystem.getContentUriAsync.mockResolvedValue('content://a.apk');

    await installApk('file:///docs/updates/a.apk');

    expect(fileSystem.getContentUriAsync).toHaveBeenCalledWith('file:///docs/updates/a.apk');
    expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
      'android.intent.action.VIEW',
      expect.objectContaining({ data: 'content://a.apk', type: 'application/vnd.android.package-archive' }),
    );
  });

  it('非 Android 明确拒绝安装', async () => {
    setOS('ios');
    await expect(installApk('file:///docs/updates/a.apk')).rejects.toThrow('仅支持 Android');
    expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
  });

  it('可打开「安装未知应用」授权页', async () => {
    await openInstallPermissionSettings();
    expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
      'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
      expect.objectContaining({ data: 'package:com.dayweave.app' }),
    );

    setOS('ios');
    jest.clearAllMocks();
    await openInstallPermissionSettings();
    expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
  });
});
