import * as FileSystem from 'expo-file-system';

import { decodeAvatarBase64 } from '@/domain/avatar';
import { supabase } from '@/lib/supabase';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const TOO_LARGE = '头像图片不能超过 5 MB，请选择较小的图片。';
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
};

/** 只上传文件；共享资料的回写由调用方通过 identity.saveProfile 编排。 */
export async function uploadAvatar(userId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('用户标识无效。');
  }
  const extension = IMAGE_EXTENSIONS[mimeType];
  if (!extension) throw new Error('请选择 JPEG、PNG、WebP 或 HEIC 图片。');
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory) throw new Error();
    if (info.size > MAX_AVATAR_BYTES) throw new Error(TOO_LARGE);
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    // 限制解码前的分配量；仍复核长度，防止读取期间文件改变。
    if (base64.length > Math.ceil(MAX_AVATAR_BYTES / 3) * 4) throw new Error(TOO_LARGE);
    const data = decodeAvatarBase64(base64);
    if (data.byteLength > MAX_AVATAR_BYTES) throw new Error(TOO_LARGE);
    const bucket = supabase.storage.from('avatars');
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error } = await bucket.upload(path, data, { contentType: mimeType, upsert: false });
    if (error) throw error;
    const { data: publicData } = bucket.getPublicUrl(path);
    if (!publicData.publicUrl) throw new Error();
    return publicData.publicUrl;
  } catch (cause) {
    if (cause instanceof Error && cause.message === TOO_LARGE) throw cause;
    throw new Error('上传头像失败，请稍后重试。');
  }
}
