import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { isNewerVersion } from '@/domain/app-version';
import { toUserMessage } from '@/lib/errors';
import * as updateService from '@/services/update.service';
import type { AppRelease } from '@/types/domain';

const STORAGE_KEY = 'update:ignoredVersion';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'available'
  | 'ignored'
  | 'unavailable'
  | 'downloading'
  | 'ready'
  | 'failed';

export interface UpdateState {
  status: UpdateStatus;
  release: AppRelease | null;
  currentVersion: string;
  receivedBytes: number;
  totalBytes: number | null;
  localUri: string | null;
  message: string | null;
  ignoredVersion: string | null;
  check: (options?: { force?: boolean }) => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
  openInstallSettings: () => Promise<void>;
  ignoreCurrent: () => Promise<void>;
  reset: () => void;
}

const idleState = {
  status: 'idle' as UpdateStatus,
  release: null,
  receivedBytes: 0,
  totalBytes: null,
  localUri: null,
  message: null,
};

export const useUpdateStore = create<UpdateState>((set, get) => ({
  ...idleState,
  currentVersion: updateService.getCurrentVersion(),
  ignoredVersion: null,

  check: async (options) => {
    const { status } = get();
    if (status === 'checking' || status === 'downloading') return;

    const currentVersion = updateService.getCurrentVersion();
    set({ status: 'checking', message: null, currentVersion });

    if (!updateService.isAndroid()) {
      set({
        ...idleState,
        status: 'unavailable',
        currentVersion,
        message: '应用内更新仅支持 Android 客户端',
      });
      return;
    }

    try {
      let ignoredVersion: string | null = null;
      try {
        ignoredVersion = await AsyncStorage.getItem(STORAGE_KEY);
      } catch {
        // 读不到本地偏好时按未忽略处理，不阻塞检查
      }
      set({ ignoredVersion });

      const release = await updateService.fetchLatestRelease();
      if (release === null) {
        set({
          ...idleState,
          status: 'unavailable',
          currentVersion,
          ignoredVersion: get().ignoredVersion,
          message: '暂时无法获取更新信息（仓库需为公开且已有 Release）',
        });
        return;
      }

      if (!isNewerVersion(release.version, currentVersion)) {
        set({ ...idleState, status: 'upToDate', currentVersion, release, ignoredVersion });
        return;
      }
      if (options?.force !== true && release.version === ignoredVersion) {
        set({ ...idleState, status: 'ignored', currentVersion, release, ignoredVersion });
        return;
      }
      set({ ...idleState, status: 'available', currentVersion, release, ignoredVersion });
    } catch (error) {
      set({
        ...idleState,
        status: 'failed',
        currentVersion,
        ignoredVersion: get().ignoredVersion,
        message: toUserMessage(error),
      });
    }
  },

  download: async () => {
    const { release, status } = get();
    if (release === null || (status !== 'available' && status !== 'failed')) return;

    set({
      status: 'downloading',
      receivedBytes: 0,
      totalBytes: release.apkSize,
      localUri: null,
      message: null,
    });

    try {
      const uri = await updateService.downloadApk(release, (progress) => {
        set({ receivedBytes: progress.received, totalBytes: progress.total ?? release.apkSize });
      });
      await updateService.verifyDownloadedApk(release, uri);
      set({
        status: 'ready',
        localUri: uri,
        receivedBytes: release.apkSize ?? get().receivedBytes,
        message: null,
      });
    } catch (error) {
      set({ status: 'failed', localUri: null, message: toUserMessage(error) });
    }
  },

  install: async () => {
    const { localUri } = get();
    if (localUri === null) return;

    try {
      await updateService.installApk(localUri);
      set({ message: null });
    } catch {
      // 绝大多数情况是系统未授予「安装未知应用」权限
      set({ status: 'ready', message: '安装失败：请先允许本应用「安装未知应用」，再点安装' });
    }
  },

  openInstallSettings: async () => {
    try {
      await updateService.openInstallPermissionSettings();
    } catch (error) {
      set({ message: toUserMessage(error) });
    }
  },

  ignoreCurrent: async () => {
    const { release } = get();
    if (release === null) return;

    set({ status: 'ignored', ignoredVersion: release.version, message: null });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, release.version);
    } catch {
      // 持久化失败只影响下次启动，不阻塞本次操作
    }
  },

  reset: () => set({ ...idleState }),
}));
