const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** 不依赖浏览器 atob / Node Buffer，原生与 Web 使用同一份解码规则。 */
export function decodeAvatarBase64(value: string): ArrayBuffer {
  if (!value || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('图片数据无效，请重新选择。');
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const last = BASE64_ALPHABET.indexOf(value[value.length - padding - 1]);
  if ((padding === 2 && (last & 15) !== 0) || (padding === 1 && (last & 3) !== 0)) {
    throw new Error('图片数据无效，请重新选择。');
  }
  const bytes = new Uint8Array((value.length / 4) * 3 - padding);
  let index = 0;
  for (let offset = 0; offset < value.length; offset += 4) {
    const chunk = (BASE64_ALPHABET.indexOf(value[offset]) << 18) |
      (BASE64_ALPHABET.indexOf(value[offset + 1]) << 12) |
      (Math.max(0, BASE64_ALPHABET.indexOf(value[offset + 2])) << 6) |
      Math.max(0, BASE64_ALPHABET.indexOf(value[offset + 3]));
    for (const shift of [16, 8, 0]) {
      if (index < bytes.length) bytes[index++] = (chunk >> shift) & 255;
    }
  }
  return bytes.buffer;
}
