/**
 * 从 dayweave-icon.png 生成发布用图标。
 * 原图是带白底和柔和边缘发光的卡片，直接裁切会把泛白的边缘带进图标，
 * 在手机上表现为「底部一条白边」，所以这里按「找内容区 → 裁正方形 → 填平边缘泛白 → 输出」处理。
 * 运行：node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./png');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'dayweave-icon.png');
const ICON = path.join(ROOT, 'assets', 'icon.png');
const ADAPTIVE = path.join(ROOT, 'assets', 'adaptive-icon.png');

const ICON_SIZE = 1024;
/** Android 自适应图标只保证中心 66% 可见，主体超出会被启动器裁掉。 */
const ADAPTIVE_SAFE_RATIO = 0.66;
/** 白色底与卡片边缘发光都是高亮度低色偏，卡片本身的浅薄荷绿亮度要低一档。 */
const WHITE_LUMA = 230;
const WHITE_MIN_RED = 210;
/** 裁切边落在「已不再泛白」的位置，边缘才不会出现一条比主体更亮的带。 */
const EDGE_LUMA = 226;
/** 需要收敛的边缘厚度（相对裁切图），覆盖原图卡片的发光与投影。 */
const EDGE_THICKNESS = 40;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isWhite = (r, g, b) => (r + g + b) / 3 > WHITE_LUMA && r > WHITE_MIN_RED;
const isWhiteAt = (img, id) => {
  const i = id * 4;
  return isWhite(img.data[i], img.data[i + 1], img.data[i + 2]);
};

/** 内容区 = 非白像素的外接矩形，用来把原图白底排除在裁切窗口之外。 */
const findContentBox = (img) => {
  let minX = img.width;
  let maxX = -1;
  let minY = img.height;
  let maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (isWhiteAt(img, y * img.width + x)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('原图没有检测到任何非白内容');
  return { minX, maxX, minY, maxY };
};

const lumaAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
};

/**
 * 把内容区四边向内收到「不再泛白」的位置。
 * 原图卡片四周有一圈柔和发光，按外接矩形直接裁切时，图标边缘会比内部更亮，
 * 在手机小尺寸下就会被读成一条白边。限制 4% 是为了避免裁到主体。
 */
const shrinkToSolidEdge = (img, box) => {
  const fractions = [0.3, 0.4, 0.5, 0.6, 0.7];
  const median = (values) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const inset = Math.round(Math.min(box.maxX - box.minX, box.maxY - box.minY) * 0.04);
  const scan = (start, end, step, locate) => {
    for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
      const [x, y] = locate(value);
      if (lumaAt(img, x, y) <= EDGE_LUMA) return value;
    }
    return start;
  };

  const top = fractions.map((f) => {
    const x = Math.round(box.minX + (box.maxX - box.minX) * f);
    return Math.min(scan(box.minY, box.maxY, 1, (y) => [x, y]), box.minY + inset);
  });
  const bottom = fractions.map((f) => {
    const x = Math.round(box.minX + (box.maxX - box.minX) * f);
    return Math.max(scan(box.maxY, box.minY, -1, (y) => [x, y]), box.maxY - inset);
  });
  const left = fractions.map((f) => {
    const y = Math.round(box.minY + (box.maxY - box.minY) * f);
    return Math.min(scan(box.minX, box.maxX, 1, (x) => [x, y]), box.minX + inset);
  });
  const right = fractions.map((f) => {
    const y = Math.round(box.minY + (box.maxY - box.minY) * f);
    return Math.max(scan(box.maxX, box.minX, -1, (x) => [x, y]), box.maxX - inset);
  });

  return {
    minX: median(left),
    maxX: median(right),
    minY: median(top),
    maxY: median(bottom),
  };
};

/** 以内容区中心裁正方形：图标必须满幅，四边留白不等会让主体看起来偏移。 */
const cropSquare = (img, box) => {
  const side = Math.min(box.maxX - box.minX + 1, box.maxY - box.minY + 1);
  const centerX = (box.minX + box.maxX + 1) / 2;
  const centerY = (box.minY + box.maxY + 1) / 2;
  const left = Math.round(clamp(centerX - side / 2, 0, img.width - side));
  const top = Math.round(clamp(centerY - side / 2, 0, img.height - side));
  const data = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) {
    const from = ((top + y) * img.width + left) * 4;
    img.data.copy(data, y * side * 4, from, from + side * 4);
  }
  return { width: side, height: side, data };
};

/** 标出与窗口边缘连通的近白像素；主体内部的高光白被绿色包住，不会进入这个集合。 */
const collectEdgeWhites = (img) => {
  const { width, height } = img;
  const mask = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const id = y * width + x;
    if (mask[id] || !isWhiteAt(img, id)) return;
    mask[id] = 1;
    queue.push(id);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    const x = id % width;
    const y = (id - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return mask;
};

/** 用最近的非白像素填平边缘白底（卡片圆角外侧），避免白色被后续处理扩散。 */
const paintEdgeWhites = (img) => {
  const { width, height, data } = img;
  const total = width * height;
  const mask = collectEdgeWhites(img);
  const distance = new Float64Array(total).fill(Infinity);
  const source = new Int32Array(total).fill(-1);
  for (let id = 0; id < total; id++) {
    if (mask[id] || isWhiteAt(img, id)) continue;
    distance[id] = 0;
    source[id] = id;
  }

  const relax = (id, neighbour, cost) => {
    if (source[neighbour] < 0) return;
    if (distance[neighbour] + cost >= distance[id]) return;
    distance[id] = distance[neighbour] + cost;
    source[id] = source[neighbour];
  };
  const diagonal = Math.SQRT2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = y * width + x;
      if (x > 0) relax(id, id - 1, 1);
      if (y > 0) relax(id, id - width, 1);
      if (x > 0 && y > 0) relax(id, id - width - 1, diagonal);
      if (x < width - 1 && y > 0) relax(id, id - width + 1, diagonal);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const id = y * width + x;
      if (x < width - 1) relax(id, id + 1, 1);
      if (y < height - 1) relax(id, id + width, 1);
      if (x < width - 1 && y < height - 1) relax(id, id + width + 1, diagonal);
      if (x > 0 && y < height - 1) relax(id, id + width - 1, diagonal);
    }
  }

  for (let id = 0; id < total; id++) {
    if (!mask[id] || source[id] < 0) continue;
    const from = source[id] * 4;
    const to = id * 4;
    data[to] = data[from];
    data[to + 1] = data[from + 1];
    data[to + 2] = data[from + 2];
    data[to + 3] = 255;
  }
  return img;
};

/**
 * 边缘色彩收敛：把最外一圈逐层拉向内侧一圈的颜色。
 * 原图卡片四边带柔和发光，按内容区裁切后图标边缘总比内部更亮，
 * 在手机小尺寸下就会被看成白边；这里让边缘与内部连成同一片渐变。
 */
const flattenEdges = (img, thickness) => {
  const { width, height, data } = img;
  const at = (x, y) => (y * width + x) * 4;
  const mix = (target, source, weight) => {
    for (let c = 0; c < 3; c++) {
      data[target + c] = Math.round(data[target + c] + (data[source + c] - data[target + c]) * weight);
    }
  };

  for (let t = 0; t < thickness; t++) {
    const weight = 1 - t / thickness;
    for (let i = thickness; i < width - thickness; i++) {
      mix(at(i, t), at(i, thickness), weight);
      mix(at(i, height - 1 - t), at(i, height - 1 - thickness), weight);
    }
    for (let i = thickness; i < height - thickness; i++) {
      mix(at(t, i), at(thickness, i), weight);
      mix(at(width - 1 - t, i), at(width - 1 - thickness, i), weight);
    }
  }

  // 四个角落的最近内侧像素在对角线上，用对角色收敛，避免用偏浅的单边颜色。
  for (let y = 0; y < thickness; y++) {
    for (let x = 0; x < thickness; x++) {
      const weight = 1 - Math.max(x, y) / thickness;
      mix(at(x, y), at(thickness, thickness), weight);
      mix(at(width - 1 - x, y), at(width - 1 - thickness, thickness), weight);
      mix(at(x, height - 1 - y), at(thickness, height - 1 - thickness), weight);
      mix(at(width - 1 - x, height - 1 - y), at(width - 1 - thickness, height - 1 - thickness), weight);
    }
  }
  return img;
};

/** 双线性缩放；应用图标不透明，alpha 固定 255。 */
const resize = (img, size) => {
  const data = Buffer.alloc(size * size * 4);
  const scale = img.width / size;
  for (let y = 0; y < size; y++) {
    const sourceY = clamp((y + 0.5) * scale - 0.5, 0, img.height - 1);
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(y0 + 1, img.height - 1);
    const wy = sourceY - y0;
    for (let x = 0; x < size; x++) {
      const sourceX = clamp((x + 0.5) * scale - 0.5, 0, img.width - 1);
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(x0 + 1, img.width - 1);
      const wx = sourceX - x0;
      const target = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        const p00 = img.data[(y0 * img.width + x0) * 4 + c];
        const p10 = img.data[(y0 * img.width + x1) * 4 + c];
        const p01 = img.data[(y1 * img.width + x0) * 4 + c];
        const p11 = img.data[(y1 * img.width + x1) * 4 + c];
        const top = p00 + (p10 - p00) * wx;
        const bottom = p01 + (p11 - p01) * wx;
        data[target + c] = Math.round(top + (bottom - top) * wy);
      }
      data[target + 3] = 255;
    }
  }
  return { width: size, height: size, data };
};

/**
 * 自适应图标前景：主体缩进安全区，外圈用图标边缘延展后柔化。
 * 边缘像素直接复制会拉出放射状条纹，所以延展后再降采样放大一次，
 * 既抹平条纹，又保留图标自身「上浅下深」的色调。
 */
const buildAdaptive = (icon) => {
  const inner = Math.round(ICON_SIZE * ADAPTIVE_SAFE_RATIO);
  const small = resize(icon, inner);
  const offset = Math.round((ICON_SIZE - inner) / 2);
  const feather = (ICON_SIZE - inner) / 2;

  const extended = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  for (let y = 0; y < ICON_SIZE; y++) {
    const sourceY = clamp(y - offset, 0, inner - 1);
    for (let x = 0; x < ICON_SIZE; x++) {
      const sourceX = clamp(x - offset, 0, inner - 1);
      const from = (sourceY * inner + sourceX) * 4;
      const to = (y * ICON_SIZE + x) * 4;
      extended[to] = small.data[from];
      extended[to + 1] = small.data[from + 1];
      extended[to + 2] = small.data[from + 2];
      extended[to + 3] = 255;
    }
  }
  const stretched = { width: ICON_SIZE, height: ICON_SIZE, data: extended };
  const softened = resize(resize(resize(stretched, 32), 128), ICON_SIZE);

  const data = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  for (let y = 0; y < ICON_SIZE; y++) {
    const edgeY = Math.abs(y - ICON_SIZE / 2) - inner / 2;
    for (let x = 0; x < ICON_SIZE; x++) {
      const edgeX = Math.abs(x - ICON_SIZE / 2) - inner / 2;
      const weight = clamp(Math.max(edgeX, edgeY) / feather, 0, 1);
      const from = (clamp(y - offset, 0, inner - 1) * inner + clamp(x - offset, 0, inner - 1)) * 4;
      const to = (y * ICON_SIZE + x) * 4;
      for (let c = 0; c < 3; c++) {
        data[to + c] = Math.round(
          small.data[from + c] + (softened.data[to + c] - small.data[from + c]) * weight,
        );
      }
      data[to + 3] = 255;
    }
  }
  return { width: ICON_SIZE, height: ICON_SIZE, data };
};

const main = () => {
  const source = decode(fs.readFileSync(SOURCE));
  const box = shrinkToSolidEdge(source, findContentBox(source));
  const cropped = flattenEdges(paintEdgeWhites(cropSquare(source, box)), EDGE_THICKNESS);
  const icon = resize(cropped, ICON_SIZE);
  const adaptive = buildAdaptive(icon);

  fs.mkdirSync(path.dirname(ICON), { recursive: true });
  fs.writeFileSync(ICON, encode(icon));
  fs.writeFileSync(ADAPTIVE, encode(adaptive));
  console.log(
    `原图 ${source.width}x${source.height} → 裁切区 (${box.minX},${box.minY}) 边长 ${cropped.width}px → 输出 ${ICON_SIZE}px`,
  );
};

main();
