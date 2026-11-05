const fs = require('fs');
const path = require('path');
const { decode } = require('./scripts/png');
const { expo } = require('./app.config');
const { DARK_COLORS, LIGHT_COLORS } = require('./src/theme/palette');

const ICON_SIZE = 1024;
/** 与应用图标边缘的实测亮度留出余量：超过这个亮度在手机上就会读成白边。 */
const EDGE_LUMA_LIMIT = 240;

const readIcon = (relativePath) => {
  expect(typeof relativePath).toBe('string');
  const png = decode(fs.readFileSync(path.join(__dirname, relativePath)));
  expect([png.width, png.height]).toEqual([ICON_SIZE, ICON_SIZE]);
  return png;
};

const pixelAt = (png, x, y) => {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
};

describe('发布图标', () => {
  const files = () => [expo.icon, expo.android.adaptiveIcon.foregroundImage];

  it('使用生成的标准图标与独立 Android 自适应图标', () => {
    expect(expo.icon).toBe('./assets/icon.png');
    expect(expo.android.adaptiveIcon.foregroundImage).toBe('./assets/adaptive-icon.png');
  });

  it('图标满幅不透明', () => {
    for (const file of files()) {
      const png = readIcon(file);
      for (let id = 0; id < png.width * png.height; id++) {
        if (png.data[id * 4 + 3] !== 255) throw new Error(`${file} 含透明像素：${id}`);
      }
    }
  });

  it('四边没有泛白，避免手机上看起来有一条白边', () => {
    for (const file of files()) {
      const png = readIcon(file);
      const edges = [];
      for (let t = 0; t < png.width; t++) edges.push([t, 0], [t, png.height - 1]);
      for (let t = 0; t < png.height; t++) edges.push([0, t], [png.width - 1, t]);
      for (const [x, y] of edges) {
        const [r, g, b] = pixelAt(png, x, y);
        const luma = (r + g + b) / 3;
        if (luma > EDGE_LUMA_LIMIT) throw new Error(`${file} 边缘泛白：${x},${y} → ${r},${g},${b}`);
      }
    }
  });

  it('Android 圆形安全区之外没有暖色卡片或深色主体', () => {
    const png = readIcon(expo.android.adaptiveIcon.foregroundImage);
    /** Android 自适应图标的前景是 108dp，其中只有中心 72dp 一定可见。 */
    const safeRadius = ICON_SIZE / 3;
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        if (Math.hypot(x - ICON_SIZE / 2, y - ICON_SIZE / 2) <= safeRadius) continue;
        const [r, g, b] = pixelAt(png, x, y);
        const warm = r - b > 25 && r > 180;
        const dark = Math.min(r, g, b) < 150 && !(g >= r && g >= b);
        if (warm || dark) throw new Error(`主体超出 Android 安全区：${x},${y}`);
      }
    }
  });
});

describe('原生启动屏', () => {
  it('启动屏使用应用图标，并与亮暗主题底色保持一致', () => {
    const entry = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
    expect(entry).toBeDefined();
    expect(entry[1]).toEqual({
      image: expo.icon,
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: LIGHT_COLORS.bg,
      dark: { image: expo.icon, backgroundColor: DARK_COLORS.bg },
    });
  });
});
