/**
 * 零依赖 PNG 编解码。
 * 只覆盖图标流水线需要的子集：8 位深度、非隔行的灰度 / RGB / RGBA。
 * 统一用 RGBA 缓冲区（Buffer，每像素 4 字节）在内存里传递，避免各步骤各自解析格式。
 */
const zlib = require('zlib');

const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
};

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
};

const decode = (buffer) => {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG 文件');
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8) throw new Error(`仅支持 8 位深度 PNG，当前为 ${bitDepth}`);
      if (interlace !== 0) throw new Error('不支持隔行扫描 PNG');
      if (!CHANNELS[colorType]) throw new Error(`不支持的 PNG 颜色类型 ${colorType}`);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const channels = CHANNELS[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const data = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? line[i - channels] : 0;
      const up = previous[i];
      const upLeft = i >= channels ? previous[i - channels] : 0;
      switch (filter) {
        case 0:
          break;
        case 1:
          line[i] = (line[i] + left) & 0xff;
          break;
        case 2:
          line[i] = (line[i] + up) & 0xff;
          break;
        case 3:
          line[i] = (line[i] + ((left + up) >> 1)) & 0xff;
          break;
        case 4:
          line[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`未知 PNG 行过滤器 ${filter}`);
      }
    }
    for (let x = 0; x < width; x++) {
      const source = x * channels;
      const target = (y * width + x) * 4;
      if (channels >= 3) {
        data[target] = line[source];
        data[target + 1] = line[source + 1];
        data[target + 2] = line[source + 2];
        data[target + 3] = channels === 4 ? line[source + 3] : 255;
      } else {
        data[target] = line[source];
        data[target + 1] = line[source];
        data[target + 2] = line[source];
        data[target + 3] = channels === 2 ? line[source + 1] : 255;
      }
    }
    previous = line;
  }

  return { width, height, data };
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
};

/** 统一按 RGB（无色板、无 alpha）输出，应用图标不需要透明通道。 */
const encode = ({ width, height, data }) => {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(stride);
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      line[x * 3] = data[source];
      line[x * 3 + 1] = data[source + 1];
      line[x * 3 + 2] = data[source + 2];
    }
    const target = y * (stride + 1);
    raw[target] = 4;
    for (let i = 0; i < stride; i++) {
      const left = i >= 3 ? line[i - 3] : 0;
      raw[target + 1 + i] = (line[i] - paeth(left, previous[i], i >= 3 ? previous[i - 3] : 0)) & 0xff;
    }
    previous = line;
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

module.exports = { decode, encode };
