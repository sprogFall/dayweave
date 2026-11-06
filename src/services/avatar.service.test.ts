import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { uploadAvatar } from './avatar.service';

jest.mock('@/lib/supabase', () => ({ supabase: { storage: { from: jest.fn() }, from: jest.fn() } }));

const uid = '11111111-1111-4111-8111-111111111111';
const upload = jest.fn();
const getPublicUrl = jest.fn();
const storageFrom = supabase.storage.from as jest.Mock;
const read = FileSystem.readAsStringAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  storageFrom.mockReturnValue({ upload, getPublicUrl });
  (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 4, isDirectory: false });
  read.mockResolvedValue('/9j/AA==');
  upload.mockResolvedValue({ error: null });
  getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } });
});

it('uploads binary jpeg to existing avatars bucket and only returns public URL', async () => {
  jest.spyOn(Date, 'now').mockReturnValueOnce(123456);
  await expect(uploadAvatar(uid, 'file:///image.jpg')).resolves.toBe('https://example.com/avatar.jpg');
  expect(read).toHaveBeenCalledWith('file:///image.jpg', { encoding: FileSystem.EncodingType.Base64 });
  expect(storageFrom).toHaveBeenCalledWith('avatars');
  expect(upload).toHaveBeenCalledWith(`${uid}/avatar-123456.jpg`, expect.any(ArrayBuffer), { contentType: 'image/jpeg', upsert: false });
  expect(Array.from(new Uint8Array(upload.mock.calls[0][1] as ArrayBuffer))).toEqual([255, 216, 255, 0]);
  expect(getPublicUrl).toHaveBeenCalledWith(`${uid}/avatar-123456.jpg`);
  expect(supabase.from).not.toHaveBeenCalled();
});

it.each(['read', 'upload', 'url'])('normalizes %s failures to Chinese', async (stage) => {
  if (stage === 'read') read.mockRejectedValueOnce(new Error('private native error'));
  if (stage === 'upload') upload.mockResolvedValueOnce({ error: { message: 'private storage detail' } });
  if (stage === 'url') getPublicUrl.mockReturnValueOnce({ data: { publicUrl: '' } });
  await expect(uploadAvatar(uid, 'file:///image.jpg')).rejects.toThrow('上传头像失败，请稍后重试。');
});

it('preserves image MIME type and matching extension for PNG', async () => {
  jest.spyOn(Date, 'now').mockReturnValueOnce(123457);
  await uploadAvatar(uid, 'file:///image.png', 'image/png');
  expect(upload).toHaveBeenCalledWith(`${uid}/avatar-123457.png`, expect.any(ArrayBuffer), { contentType: 'image/png', upsert: false });
});

it('rejects oversized images before reading base64', async () => {
  (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 5 * 1024 * 1024 + 1 });
  await expect(uploadAvatar(uid, 'file:///large.jpg')).rejects.toThrow('头像图片不能超过 5 MB');
  expect(read).not.toHaveBeenCalled();
  expect(upload).not.toHaveBeenCalled();
});

it('rejects unsupported media before requests', async () => {
  await expect(uploadAvatar(uid, 'file:///image.svg', 'image/svg+xml')).rejects.toThrow('请选择 JPEG、PNG、WebP 或 HEIC 图片');
  expect(read).not.toHaveBeenCalled();
});

it('rejects unsafe user paths before filesystem or storage requests', async () => {
  await expect(uploadAvatar('../other', 'file:///image.jpg')).rejects.toThrow('用户标识无效');
  expect(read).not.toHaveBeenCalled();
  expect(storageFrom).not.toHaveBeenCalled();
});
