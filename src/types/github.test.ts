import { toAppRelease, type GithubReleaseRow } from './github';

const row: GithubReleaseRow = {
  tag_name: 'v0.2.0',
  name: 'Dayweave 0.2.0',
  body: '- 新功能\nAPK-Mirror: https://mirror.example.com/dayweave.apk',
  html_url: 'https://github.com/sprogFall/dayweave/releases/tag/v0.2.0',
  published_at: '2026-11-06T10:00:00Z',
  assets: [
    { name: 'dayweave-v0.2.0.apk', browser_download_url: 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk', size: 2048 },
    { name: 'dayweave-v0.2.0.apk.sha256', browser_download_url: 'https://github.com/x/sha256', size: 64 },
  ],
};

describe('GitHub Release 行映射', () => {
  it('maps snake_case rows into domain objects and reads declared mirrors', () => {
    expect(toAppRelease(row)).toEqual({
      tagName: 'v0.2.0',
      version: '0.2.0',
      title: 'Dayweave 0.2.0',
      notes: row.body,
      pageUrl: row.html_url,
      apkUrl: 'https://github.com/sprogFall/dayweave/releases/download/v0.2.0/dayweave-v0.2.0.apk',
      apkSize: 2048,
      mirrors: ['https://mirror.example.com/dayweave.apk'],
      publishedAt: '2026-11-06T10:00:00Z',
    });
  });

  it('falls back to the tag as title and tolerates missing optional fields', () => {
    const result = toAppRelease({
      tag_name: 'v0.3.0',
      html_url: 'https://github.com/sprogFall/dayweave/releases/tag/v0.3.0',
      assets: [{ name: 'A.APK', browser_download_url: 'https://github.com/a.apk' }],
    });

    expect(result).toMatchObject({
      title: 'v0.3.0',
      apkSize: null,
      mirrors: [],
      publishedAt: null,
      notes: '',
    });
  });

  it('rejects drafts, non-version tags, missing page and missing apk assets', () => {
    expect(toAppRelease({ ...row, draft: true })).toBeNull();
    expect(toAppRelease({ ...row, tag_name: 'build-42' })).toBeNull();
    expect(toAppRelease({ ...row, html_url: '  ' })).toBeNull();
    expect(toAppRelease({ ...row, assets: [] })).toBeNull();
    expect(toAppRelease({ ...row, assets: [{ name: 'notes.md', browser_download_url: 'https://github.com/a' }] })).toBeNull();
    expect(toAppRelease({ ...row, assets: [{ name: 'a.apk' }] })).toBeNull();
  });
});
