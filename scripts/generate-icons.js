/** 从用户原图去除白色外边；边缘像素延展为满幅背景，不改动主体。 */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = await Jimp.read(path.join(root, 'dayweave-icon.png'));
  const icon = source.clone().crop(84, 86, 1084, 1084);
  for (let y = 0; y < icon.bitmap.height; y++) {
    const green = (x) => {
      const { r, g, b } = Jimp.intToRGBA(icon.getPixelColor(x, y));
      return g - r > 25 && g - b > 8;
    };
    let left = 20;
    let right = icon.bitmap.width - 21;
    while (left < right && !green(left)) left++;
    while (right > left && !green(right)) right--;
    const leftColor = icon.getPixelColor(left, y);
    const rightColor = icon.getPixelColor(right, y);
    for (let x = 0; x < left; x++) icon.setPixelColor(leftColor, x, y);
    for (let x = right + 1; x < icon.bitmap.width; x++) icon.setPixelColor(rightColor, x, y);
  }
  icon.resize(1024, 1024).colorType(2);
  const foreground = icon.clone().resize(640, 640);
  // Android 允许对前景缩放 / 平移；把主体放在中心 2/3 圆形安全区内。
  const adaptive = new Jimp(1024, 1024);
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const sx = Math.max(0, Math.min(639, x - 192));
      const sy = Math.max(0, Math.min(639, y - 192));
      adaptive.setPixelColor(foreground.getPixelColor(sx, sy), x, y);
    }
  }
  const assets = path.join(root, 'assets');
  fs.mkdirSync(assets, { recursive: true });
  await icon.writeAsync(path.join(assets, 'icon.png'));
  await adaptive.colorType(2).writeAsync(path.join(assets, 'adaptive-icon.png'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
