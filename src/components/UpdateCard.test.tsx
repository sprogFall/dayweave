import { act, fireEvent, render, screen } from '@testing-library/react-native';

import * as updateService from '@/services/update.service';
import { useUpdateStore } from '@/stores/update.store';
import type { AppRelease } from '@/types/domain';

import { UpdateCard } from './UpdateCard';

jest.mock('@/services/update.service');

const mocked = updateService as jest.Mocked<typeof updateService>;

const release: AppRelease = {
  tagName: 'v0.2.0',
  version: '0.2.0',
  title: 'Dayweave 0.2.0',
  notes: '- 新的弹窗样式\n- 底部图标',
  pageUrl: 'https://github.com/sprogFall/dayweave/releases/tag/v0.2.0',
  apkUrl: 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk',
  apkSize: 200,
  mirrors: [],
  publishedAt: null,
};

function setState(patch: Partial<ReturnType<typeof useUpdateStore.getState>>) {
  act(() => {
    useUpdateStore.setState(patch);
  });
}

beforeEach(() => {
  [
    mocked.isAndroid,
    mocked.fetchLatestRelease,
    mocked.downloadApk,
    mocked.verifyDownloadedApk,
    mocked.installApk,
    mocked.openInstallPermissionSettings,
  ].forEach((fn) => fn.mockReset());

  mocked.isAndroid.mockReturnValue(true);
  mocked.getCurrentVersion.mockReturnValue('0.1.1');
  mocked.fetchLatestRelease.mockResolvedValue(null);
  mocked.downloadApk.mockResolvedValue('file:///docs/updates/a.apk');
  mocked.verifyDownloadedApk.mockResolvedValue(undefined);
  mocked.installApk.mockResolvedValue(undefined);
  mocked.openInstallPermissionSettings.mockResolvedValue(undefined);

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

describe('UpdateCard', () => {
  it('展示当前版本并提供手动检查入口', async () => {
    render(<UpdateCard />);

    expect(screen.getByText('应用更新')).toBeTruthy();
    expect(screen.getByText('当前版本 v0.1.1')).toBeTruthy();
    expect(screen.getByText('检查是否有新版本可用')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('检查更新'));
    });
    expect(mocked.fetchLatestRelease).toHaveBeenCalledTimes(1);
  });

  it('发现新版本时展示说明并可开始下载', async () => {
    render(<UpdateCard />);
    setState({ status: 'available', release });

    expect(screen.getByText('发现新版本 v0.2.0')).toBeTruthy();
    expect(screen.getByText('- 新的弹窗样式\n- 底部图标')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('立即更新'));
    });
    expect(mocked.downloadApk).toHaveBeenCalledWith(release, expect.any(Function));
  });

  it('下载中显示百分比与字节进度', () => {
    render(<UpdateCard />);
    setState({ status: 'downloading', release, receivedBytes: 50, totalBytes: 200 });

    expect(screen.getByText(/正在下载 25%/)).toBeTruthy();
  });

  it('下载完成后可安装', async () => {
    render(<UpdateCard />);
    setState({ status: 'ready', release, localUri: 'file:///docs/updates/a.apk' });

    expect(screen.getByText('安装包已下载完成，点击安装即可升级到 v0.2.0')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('安装'));
    });
    expect(mocked.installApk).toHaveBeenCalledWith('file:///docs/updates/a.apk');
  });

  it('安装缺少权限时给出授权入口', () => {
    render(<UpdateCard />);
    setState({
      status: 'ready',
      release,
      localUri: 'file:///docs/updates/a.apk',
      message: '安装失败：请先允许本应用「安装未知应用」，再点安装',
    });

    expect(screen.getByText(/安装失败/)).toBeTruthy();
    expect(screen.getByLabelText('去允许「安装未知应用」')).toBeTruthy();
  });

  it('失败与不可用状态展示原因和重试入口', () => {
    render(<UpdateCard />);
    setState({ status: 'failed', release, message: '安装包下载失败，请稍后重试' });

    expect(screen.getByText('安装包下载失败，请稍后重试')).toBeTruthy();
    expect(screen.getByLabelText('重试下载')).toBeTruthy();
  });

  it('已是最新版本时给出明确反馈', () => {
    render(<UpdateCard />);
    setState({ status: 'upToDate', release });

    expect(screen.getByText('已是最新版本，无需更新')).toBeTruthy();
  });
});
