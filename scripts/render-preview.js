/**
 * 用真实 React 组件（react-native-web SSR）重绘 docs/preview 下的页面大纲预览图。
 *
 * 依赖均来自现有 Expo / Jest 依赖链：@babel/register、react-native-web、react-dom。
 * 运行：node scripts/render-preview.js
 * 截图浏览器优先取环境变量 BROWSER_PATH，其次取系统 Edge。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const { execFileSync } = require('child_process');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const outDir = path.join(root, 'docs', 'preview');
const VIEW = { width: 390, height: 844, scale: 2 };
const OVERVIEW = { width: 940, height: 450, scale: 2 };
const UNITLESS = new Set([
  'flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'fontWeight',
  'lineHeight', 'aspectRatio', 'elevation', 'shadowOpacity', 'shadowRadius',
]);

require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [[require.resolve('babel-preset-expo'), {}]],
  babelrc: false,
  configFile: false,
  cache: false,
  only: [/[\\/]src[\\/]/],
  ignore: [/node_modules/],
});

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'react-native') request = 'react-native-web';
  else if (request.startsWith('@/')) request = path.join(src, request.slice(2));
  return resolveFilename.call(this, request, parent, ...rest);
};

const { View, Text, StyleSheet, AppRegistry } = require('react-native-web');
const glyphs = require(
  path.join(root, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'),
);
const ioniconsFont = fs.readFileSync(
  path.join(root, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
);
const zeroInsets = { top: 0, left: 0, right: 0, bottom: 0 };

function toDomStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const css = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value == null || typeof value === 'object') continue;
    css[key] = typeof value === 'number' && !UNITLESS.has(key) ? `${value}px` : value;
  }
  return css;
}

function glyph(name) {
  const code = glyphs[name];
  return typeof code === 'number' ? String.fromCharCode(code) : (code ?? '?');
}

const mocks = {
  '@/lib/supabase': { supabase: {} },
  'react-native-safe-area-context': {
    SafeAreaView: ({ style, children }) => React.createElement(View, { style }, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => zeroInsets,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: VIEW.width, height: VIEW.height },
      insets: zeroInsets,
    },
  },
  '@expo/vector-icons': {
    Ionicons: ({ name, size = 16, color = '#000' }) =>
      React.createElement(
        'span',
        {
          style: {
            fontFamily: 'Ionicons',
            fontSize: `${size}px`,
            lineHeight: `${size}px`,
            color,
            display: 'inline-block',
          },
        },
        glyph(name),
      ),
  },
  'expo-linear-gradient': {
    LinearGradient: ({ colors, style, children }) =>
      React.createElement(
        'div',
        {
          style: {
            ...toDomStyle(style),
            backgroundImage: `linear-gradient(180deg, ${colors.join(', ')})`,
          },
        },
        children,
      ),
  },
  '@react-navigation/native': {
    useNavigation: () => ({ navigate() {}, goBack() {} }),
    useRoute: () => ({ params: { toolId: 'work-hours' } }),
    NavigationContainer: ({ children }) => children,
    DefaultTheme: {},
    DarkTheme: {},
  },
};
const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(mocks, request)) return mocks[request];
  return load.call(this, request, parent, isMain);
};

const { LIGHT_COLORS } = require(path.join(src, 'theme/palette.ts'));
const { getTabBarStyle, getTabBarTints, TAB_BAR_LABEL_STYLE } = require(
  path.join(src, 'navigation/tabBar.ts'),
);
const { TabIcon } = require(path.join(src, 'components/ui/TabIcon.tsx'));

const SCREENS = [
  { file: 'today.png', label: '今天', route: 'Today', module: 'screens/today/TodayScreen.tsx', name: 'TodayScreen' },
  { file: 'tools.png', label: '工具', route: 'Tools', module: 'screens/tools/ToolsScreen.tsx', name: 'ToolsScreen' },
  { file: 'tasks.png', label: '待办', route: 'Tasks', module: 'screens/tasks/TasksScreen.tsx', name: 'TasksScreen' },
  { file: 'profile.png', label: '我的', route: 'Profile', module: 'screens/profile/ProfileScreen.tsx', name: 'ProfileScreen' },
  {
    file: 'tool-detail.png',
    label: '工具详情（留空）',
    route: 'Tools',
    module: 'screens/tools/ToolPlaceholderScreen.tsx',
    name: 'ToolPlaceholderScreen',
  },
];

const TABS = [
  { route: 'Today', label: '今天' },
  { route: 'Tools', label: '工具' },
  { route: 'Tasks', label: '待办' },
  { route: 'Profile', label: '我的' },
];

function TabBar({ active }) {
  const tints = getTabBarTints(LIGHT_COLORS);
  return React.createElement(
    View,
    {
      style: {
        ...getTabBarStyle(LIGHT_COLORS, 0),
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
      },
    },
    TABS.map((tab) => {
      const selected = tab.route === active;
      return React.createElement(
        View,
        { key: tab.route, style: { flex: 1, alignItems: 'center', gap: 2 } },
        React.createElement(TabIcon, { name: tab.route, focused: selected }),
        React.createElement(
          Text,
          {
            style: {
              ...TAB_BAR_LABEL_STYLE,
              color: selected ? tints.active : tints.inactive,
              textAlign: 'center',
            },
          },
          tab.label,
        ),
      );
    }),
  );
}

function frame(ScreenComponent, active) {
  return () =>
    React.createElement(
      View,
      {
        style: {
          width: VIEW.width,
          height: VIEW.height,
          overflow: 'hidden',
          backgroundColor: LIGHT_COLORS.bg,
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, overflow: 'hidden' } },
        React.createElement(ScreenComponent),
      ),
      React.createElement(TabBar, { active }),
    );
}

function shell(html, css, width, height, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Ionicons;src:url(data:font/ttf;base64,${ioniconsFont.toString('base64')}) format('truetype');font-display:block}
html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden;background:#F7FBFA}
#root{width:${width}px;height:${height}px}
[class*="css-text"]{font-family:"Segoe UI","Microsoft YaHei",sans-serif !important}
${extraCss}</style>${css}</head><body><div id="root">${html}</div></body></html>`;
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const found = candidates.find((item) => item && fs.existsSync(item));
  if (!found) throw new Error('未找到截图浏览器，请设置 BROWSER_PATH');
  return found;
}

function screenshot(browser, tmp, htmlFile, pngFile, viewport) {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--user-data-dir=${path.join(tmp, 'browser-profile')}`,
    `--force-device-scale-factor=${viewport.scale}`,
    `--window-size=${viewport.width},${viewport.height}`,
    `--virtual-time-budget=6000`,
    `--screenshot=${pngFile}`,
    `file:///${htmlFile.replace(/\\/g, '/')}`,
  ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 90000 });
  if (!fs.existsSync(pngFile)) throw new Error(`截图失败：${pngFile}`);
}

function main() {
  const browser = findBrowser();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dayweave-preview-'));
  // 预览图固定在同一时刻，保证每次生成结果一致。
  const fixed = new Date(2026, 10, 6, 9, 0, 0).getTime();
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [fixed]));
    }
    static now() {
      return fixed;
    }
  };

  try {
    fs.mkdirSync(outDir, { recursive: true });
    for (const item of SCREENS) {
      const ScreenComponent = require(path.join(src, item.module))[item.name];
      AppRegistry.registerComponent(item.route + item.name, () => frame(ScreenComponent, item.route));
      const { element, getStyleElement } = AppRegistry.getApplication(item.route + item.name, {});
      const html = ReactDOMServer.renderToString(element);
      const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());
      const htmlFile = path.join(tmp, `${item.file}.html`);
      fs.writeFileSync(htmlFile, shell(html, css, VIEW.width, VIEW.height));
      screenshot(browser, tmp, htmlFile, path.join(outDir, item.file), VIEW);
      console.log('生成', item.file);
    }

    const figures = SCREENS.map(
      (item) => `<figure><img src="file:///${path.join(outDir, item.file).replace(/\\/g, '/')}"><figcaption>${item.label}</figcaption></figure>`,
    ).join('');
    const overviewCss = `
body{font-family:"Segoe UI","Microsoft YaHei",sans-serif;color:#16213A;padding:12px 26px;box-sizing:border-box}
h1{font-size:14px;margin:0 0 2px;font-weight:800;letter-spacing:.4px}
p{font-size:9px;margin:0 0 8px;color:#7A8598}
.row{display:flex;gap:12px;align-items:flex-start}
figure{margin:0;width:168px;text-align:center}
img{width:168px;height:363px;object-fit:cover;border-radius:8px;box-shadow:0 4px 14px rgba(15,44,34,.08);display:block}
figcaption{font-size:9px;color:#7A8598;margin-top:4px}`;
    const overviewHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${overviewCss}</style></head><body>
<h1>Dayweave · 页面大纲</h1><p>浅色主题 · 演示数据 · 工具页留空</p>
<div class="row">${figures}</div></body></html>`;
    const overviewFile = path.join(tmp, 'overview.html');
    fs.writeFileSync(overviewFile, overviewHtml);
    screenshot(browser, tmp, overviewFile, path.join(outDir, 'overview.png'), OVERVIEW);
    console.log('生成 overview.png');
  } finally {
    global.Date = RealDate;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
