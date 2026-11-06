import {
  compareAppVersions,
  formatAppVersion,
  isNewerVersion,
  normalizeVersionTag,
  parseAppVersion,
  type AppVersion,
} from './app-version';

const version = (major: number, minor: number, patch: number, prerelease: string[] = []): AppVersion => ({
  major,
  minor,
  patch,
  prerelease,
});

describe('app-version', () => {
  it('parses tags with optional parts and build metadata', () => {
    expect(parseAppVersion('v0.2.0')).toEqual(version(0, 2, 0));
    expect(parseAppVersion('1.2')).toEqual(version(1, 2, 0));
    expect(parseAppVersion('2')).toEqual(version(2, 0, 0));
    expect(parseAppVersion('1.2.3+build.7')).toEqual(version(1, 2, 3));
    expect(parseAppVersion('1.2.3-beta.1')).toEqual(version(1, 2, 3, ['beta', '1']));
    expect(parseAppVersion('build-42')).toBeNull();
    expect(parseAppVersion('')).toBeNull();
  });

  it('formats and normalizes versions', () => {
    expect(formatAppVersion(version(0, 2, 0))).toBe('0.2.0');
    expect(formatAppVersion(version(1, 2, 3, ['beta', '1']))).toBe('1.2.3-beta.1');
    expect(normalizeVersionTag('V1.2')).toBe('1.2.0');
    expect(normalizeVersionTag('build-42')).toBeNull();
  });

  it('compares cores and prerelease identifiers by semver rules', () => {
    expect(compareAppVersions(version(0, 2, 0), version(0, 1, 9))).toBe(1);
    expect(compareAppVersions(version(1, 0, 0), version(1, 0, 0))).toBe(0);
    expect(compareAppVersions(version(1, 0, 0, ['beta']), version(1, 0, 0))).toBe(-1);
    expect(compareAppVersions(version(1, 0, 0), version(1, 0, 0, ['beta']))).toBe(1);
    expect(compareAppVersions(version(1, 0, 0, ['alpha', '2']), version(1, 0, 0, ['alpha', '10']))).toBe(-1);
    expect(compareAppVersions(version(1, 0, 0, ['1']), version(1, 0, 0, ['beta']))).toBe(-1);
    expect(compareAppVersions(version(1, 0, 0, ['alpha']), version(1, 0, 0, ['alpha', '1']))).toBe(-1);
  });

  it('only reports a strictly newer valid version', () => {
    expect(isNewerVersion('v0.2.0', '0.1.1')).toBe(true);
    expect(isNewerVersion('0.1.1', '0.1.1')).toBe(false);
    expect(isNewerVersion('0.1.0', '0.2.0')).toBe(false);
    expect(isNewerVersion('1.0.0-beta', '1.0.0')).toBe(false);
    expect(isNewerVersion('build-42', '0.1.0')).toBe(false);
    expect(isNewerVersion('0.2.0', '')).toBe(false);
  });
});
