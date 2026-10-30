import { isValidEmail, validateDisplayName, validateEmail, validatePassword } from './validation';

describe('validation', () => {
  it('accepts a normal email address', () => {
    expect(isValidEmail('hello@dayweave.app')).toBe(true);
    expect(validateEmail('hello@dayweave.app')).toBeNull();
  });

  it('rejects malformed or empty email addresses', () => {
    expect(validateEmail('')).toBe('请输入邮箱地址。');
    expect(validateEmail('hello')).toBe('请输入有效的邮箱地址。');
  });

  it('requires passwords with at least eight characters', () => {
    expect(validatePassword('1234567')).toBe('密码至少需要 8 个字符。');
    expect(validatePassword('12345678')).toBeNull();
  });

  it('trims display names and enforces the upper bound', () => {
    expect(validateDisplayName('  ')).toBe('请输入昵称。');
    expect(validateDisplayName('  小织  ')).toBeNull();
    expect(validateDisplayName('a'.repeat(25))).toBe('昵称不能超过 24 个字符。');
  });
});
