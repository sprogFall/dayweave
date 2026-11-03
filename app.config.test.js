const fs = require('fs');
const path = require('path');
const parsePng = require('parse-png');
const { expo } = require('./app.config');
const { DARK_COLORS, LIGHT_COLORS } = require('./src/theme/palette');

const readIcon = async (relativePath) => {
  expect(typeof relativePath).toBe('string');
  const png = await parsePng(fs.readFileSync(path.join(__dirname, relativePath)));
  expect([png.width, png.height]).toEqual([1024, 1024]);
  return png;
};

describe('发布图标', () => {
  it('使用生成的标准图标与独立 Android 自适应图标', async () => {
    expect(expo.icon).toBe('./assets/icon.png');
    expect(expo.android.adaptiveIcon.foregroundImage).toBe('./assets/adaptive-icon.png');
    for (const file of [expo.icon, expo.android.adaptiveIcon.foregroundImage]) {
      const png = await readIcon(file);
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const i = (y * png.width + x) * 4;
          if (png.data[i + 3] !== 255) throw new Error(`${file} 含透明像素：${x},${y}`);
          if (x > 1 && y > 1 && x < 1022 && y < 1022) continue;
          if (Math.min(...png.data.subarray(i, i + 3)) > 244) {
            throw new Error(`${file} 边缘仍有白边：${x},${y}`);
          }
        }
      }
    }
  });

  it('Android 圆形安全区之外没有暖色卡片或深色主体', async () => {
    const png = await readIcon(expo.android.adaptiveIcon.foregroundImage);
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        if (Math.hypot(x - 512, y - 512) <= 1024 / 3) continue;
        const i = (y * png.width + x) * 4;
        const [r, g, b] = png.data.subarray(i, i + 3);
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
