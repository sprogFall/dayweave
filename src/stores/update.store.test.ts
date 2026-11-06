import AsyncStorage from '@react-native-async-storage/async-storage';

import * as updateService from '@/services/update.service';
import type { AppRelease } from '@/types/domain';

import { useUpdateStore } from './update.store';

jest.mock('@/services/update.service');

const mocked = updateService as jest.Mocked<typeof updateService>;
const STORAGE_KEY = 'update:ignoredVersion';

const release: AppRelease = {
  tagName: 'v0.2.0',
  version: '0.2.0',
  title: 'Dayweave 0.2.0',
  notes: '说明',
  pageUrl: 'https://github.com/sprogFall/dayweave/releases/tag/v0.2.0',
  apkUrl: 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk',
  apkSize: 200,
  mirrors: [],
  publishedAt: null,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  [
    mocked.isAndroid,
    mocked.getCurrentVersion,
    mocked.fetchLatestRelease,
    mocked.downloadApk,
    mocked.verifyDownloadedApk,
    mocked.installApk,
    mocked.openInstallPermissionSettings,
  ].forEach((fn) => fn.mockReset());

  mocked.isAndroid.mockReturnValue(true);
  mocked.getCurrentVersion.mockReturnValue('0.1.1');
  useUpdateStore.setState({
    status: 'idle',
    release: null,
    currentVersion: '0.1.1',
    receivedBytes: 0,
    totalBytes: null,
    localUri: null,
    message: null,
    ignoredVersion: null,
  });
});

describe('useUpdateStore.check', () => {
  it('发现新版本时进入 available 并带上 Release 信息', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(release);

    await useUpdateStore.getState().check();

    expect(useUpdateStore.getState()).toMatchObject({
      status: 'available',
      release,
      currentVersion: '0.1.1',
      message: null,
    });
  });

  it('同版本为 upToDate', async () => {
    mocked.fetchLatestRelease.mockResolvedValue({ ...release, version: '0.1.1' });

    await useUpdateStore.getState().check();

    expect(useUpdateStore.getState().status).toBe('upToDate');
  });

  it('拿不到更新信息时给出可读提示', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(null);

    await useUpdateStore.getState().check();

    expect(useUpdateStore.getState()).toMatchObject({
      status: 'unavailable',
      message: '暂时无法获取更新信息（仓库需为公开且已有 Release）',
    });
  });

  it('非 Android 不下发更新提示', async () => {
    mocked.isAndroid.mockReturnValue(false);

    await useUpdateStore.getState().check();

    expect(useUpdateStore.getState()).toMatchObject({
      status: 'unavailable',
      message: '应用内更新仅支持 Android 客户端',
    });
    expect(mocked.fetchLatestRelease).not.toHaveBeenCalled();
  });

  it('请求失败时进入 failed 并保留错误文案', async () => {
    mocked.fetchLatestRelease.mockRejectedValue(new Error('检查更新失败（HTTP 500）'));

    await useUpdateStore.getState().check();

    expect(useUpdateStore.getState()).toMatchObject({
      status: 'failed',
      message: '检查更新失败（HTTP 500）',
    });
  });

  it('被忽略的版本不再提示，强制检查时仍提示', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(release);
    await useUpdateStore.getState().check();
    await useUpdateStore.getState().ignoreCurrent();

    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('0.2.0');

    useUpdateStore.getState().reset();
    await useUpdateStore.getState().check();
    expect(useUpdateStore.getState().status).toBe('ignored');

    await useUpdateStore.getState().check({ force: true });
    expect(useUpdateStore.getState().status).toBe('available');
  });

  it('检查中重复触发不叠加请求', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(release);

    await Promise.all([useUpdateStore.getState().check(), useUpdateStore.getState().check()]);

    expect(mocked.fetchLatestRelease).toHaveBeenCalledTimes(1);
  });
});

describe('useUpdateStore.download', () => {
  it('透传进度、校验后进入 ready', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(release);
    mocked.downloadApk.mockImplementation(async (_release, onProgress) => {
      onProgress?.({ received: 50, total: 200 });
      onProgress?.({ received: 200, total: 200 });
      return 'file:///docs/updates/a.apk';
    });
    mocked.verifyDownloadedApk.mockResolvedValue(undefined);

    await useUpdateStore.getState().check();
    await useUpdateStore.getState().download();

    expect(mocked.verifyDownloadedApk).toHaveBeenCalledWith(release, 'file:///docs/updates/a.apk');
    expect(useUpdateStore.getState()).toMatchObject({
      status: 'ready',
      localUri: 'file:///docs/updates/a.apk',
      receivedBytes: 200,
      totalBytes: 200,
    });
  });

  it('下载失败时进入 failed 并给出原因', async () => {
    mocked.fetchLatestRelease.mockResolvedValue(release);
    mocked.downloadApk.mockRejectedValue(new Error('安装包下载失败，请稍后重试'));

    await useUpdateStore.getState().check();
    await useUpdateStore.getState().download();

    expect(useUpdateStore.getState()).toMatchObject({
      status: 'failed',
      localUri: null,
      message: '安装包下载失败，请稍后重试',
    });
  });

  it('没有可用版本时下载不做任何事', async () => {
    await useUpdateStore.getState().download();
    expect(mocked.downloadApk).not.toHaveBeenCalled();
  });
});

describe('useUpdateStore.install', () => {
  it('调用系统安装器', async () => {
    useUpdateStore.setState({ status: 'ready', localUri: 'file:///docs/updates/a.apk', release });

    await useUpdateStore.getState().install();

    expect(mocked.installApk).toHaveBeenCalledWith('file:///docs/updates/a.apk');
  });

  it('安装失败时提示授权并可跳转设置页', async () => {
    useUpdateStore.setState({ status: 'ready', localUri: 'file:///docs/updates/a.apk', release });
    mocked.installApk.mockRejectedValue(new Error('Permission denied'));

    await useUpdateStore.getState().install();
    expect(useUpdateStore.getState().message).toContain('安装未知应用');

    await useUpdateStore.getState().openInstallSettings();
    expect(mocked.openInstallPermissionSettings).toHaveBeenCalled();
  });
});
