import {
  DEFAULT_PROXY_PREFIX,
  apkFileName,
  buildProxyUrl,
  describeSizeProblem,
  extractApkMirrors,
  formatBytes,
  progressPercent,
  resolveDownloadUrls,
  toDisplayNotes,
} from './update';

const APK_URL = 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk';

describe('update domain', () => {
  it('only proxies https GitHub release assets', () => {
    expect(buildProxyUrl(APK_URL)).toBe(`${DEFAULT_PROXY_PREFIX}${APK_URL}`);
    expect(buildProxyUrl(APK_URL, 'https://mirror.example')).toBe(`https://mirror.example/${APK_URL}`);
    expect(buildProxyUrl(APK_URL, '')).toBeNull();
    expect(buildProxyUrl('https://github.com/sprogFall/dayweave')).toBeNull();
    expect(buildProxyUrl('https://example.com/releases/download/v1/a.apk')).toBeNull();
    expect(buildProxyUrl('http://github.com/x/releases/download/v1/a.apk')).toBeNull();
    expect(buildProxyUrl('不是地址')).toBeNull();
  });

  it('orders mirrors, proxy and direct link without duplicates', () => {
    expect(resolveDownloadUrls(APK_URL, ['https://mirror.example.com/a.apk'])).toEqual([
      'https://mirror.example.com/a.apk',
      `${DEFAULT_PROXY_PREFIX}${APK_URL}`,
      APK_URL,
    ]);
    expect(resolveDownloadUrls(APK_URL, [`${DEFAULT_PROXY_PREFIX}${APK_URL}`, APK_URL])).toEqual([
      `${DEFAULT_PROXY_PREFIX}${APK_URL}`,
      APK_URL,
    ]);
    expect(resolveDownloadUrls(APK_URL, [], '')).toEqual([APK_URL]);
  });

  it('builds a versioned local filename', () => {
    expect(apkFileName('0.2.0')).toBe('dayweave-0.2.0.apk');
    expect(apkFileName('')).toBe('dayweave-latest.apk');
  });

  it('extracts https mirrors from release notes and strips them from display text', () => {
    const notes = [
      'Dayweave 0.2.0',
      '',
      '- 新功能',
      'APK-Mirror: https://mirror.example.com/a.apk',
      'apk-mirror：https://mirror.example.com/a.apk',
      'APK-Mirror: http://insecure.example.com/a.apk',
      'APK-Mirror: not-a-url',
      'SHA256: ' + 'a'.repeat(64),
    ].join('\n');

    expect(extractApkMirrors(notes)).toEqual(['https://mirror.example.com/a.apk']);
    expect(toDisplayNotes(notes)).toContain('Dayweave 0.2.0');
    expect(toDisplayNotes(notes)).toContain('- 新功能');
    expect(toDisplayNotes(notes)).not.toContain('APK-Mirror');
    expect(toDisplayNotes(notes)).not.toContain('SHA256');
  });

  it('truncates long release notes for the card', () => {
    const notes = Array.from({ length: 20 }, (_, index) => `第 ${index + 1} 行`).join('\n');
    const lines = toDisplayNotes(notes).split('\n');

    expect(lines).toHaveLength(12);
    expect(lines[11]).toBe('…');
  });

  it('checks downloaded size and computes progress', () => {
    expect(describeSizeProblem(1234, 1234)).toBeNull();
    expect(describeSizeProblem(1234, null)).toBeNull();
    expect(describeSizeProblem(1200, 1234)).toBe('安装包大小与发布信息不一致，请重新下载');
    expect(progressPercent(50, 200)).toBe(25);
    expect(progressPercent(300, 200)).toBe(100);
    expect(progressPercent(50, null)).toBeNull();
    expect(progressPercent(50, 0)).toBeNull();
  });

  it('formats byte counts for the progress label', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});
