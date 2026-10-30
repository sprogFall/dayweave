/** 将底层异常归一为可直接展示给用户的中文文案。 */
export function toUserMessage(error: unknown, fallback = '操作失败，请稍后重试。'): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}
