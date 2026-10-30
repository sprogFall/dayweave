const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return '请输入邮箱地址。';
  if (!isValidEmail(value)) return '请输入有效的邮箱地址。';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return '请输入密码。';
  if (value.length < 8) return '密码至少需要 8 个字符。';
  return null;
}

export function validateDisplayName(value: string): string | null {
  const name = value.trim();
  if (!name) return '请输入昵称。';
  if (name.length > 24) return '昵称不能超过 24 个字符。';
  return null;
}
