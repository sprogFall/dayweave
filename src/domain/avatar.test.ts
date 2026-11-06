import { decodeAvatarBase64 } from './avatar';

it.each([['/9j/AA==', [255, 216, 255, 0]], ['AQI=', [1, 2]], ['AQID', [1, 2, 3]]])('decodes base64 %s without native dependencies', (base64, expected) => {
  expect(Array.from(new Uint8Array(decodeAvatarBase64(base64 as string)))).toEqual(expected);
});

it.each(['', 'bad!', 'A===', '====', 'A', 'AB=='])('rejects invalid or empty image data %s', (value) => {
  expect(() => decodeAvatarBase64(value)).toThrow('图片数据无效');
});
