# Dayweave

<div align="center">

**生活助手 · 把今天，织成你想要的样子。**

一个基于 **Expo + React Native + TypeScript + Supabase** 的生活助手应用基础工程。

[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Jest](https://img.shields.io/badge/Test-Jest%20%2B%20RNTL-C21325?logo=jest&logoColor=white)](https://jestjs.io/)

</div>

## 项目简介

Dayweave 是一个面向个人生活场景的助手工具。当前仓库处于**基础工程初始化阶段**，已经搭好后续功能开发所需的通用底座：

- 邮箱注册 / 登录 / 退出，Supabase 会话持久化；
- 注册时自动建立用户资料；
- 登录态与未登录态路由切换；
- 「今天 / 工具 / 待办 / 我的」四 Tab 应用外壳与页面大纲；
- 工具详情占位页（功能留空，仅定版式）；
- 亮色 / 暗色主题、统一设计令牌与基础 UI 组件；
- Supabase 行级安全（RLS）初始化脚本；
- Jest 离线测试、TypeScript 严格类型检查与 GitHub Actions CI。

> 本仓库不包含任何记账、家庭账本或旧项目业务逻辑。后续功能应围绕 Dayweave 自身的生活助手定位独立设计。

## 页面大纲

当前阶段先把页面风格与信息结构定下来：四个主页面均为静态演示，页面上的工时、待办、天气等数字是示例数据，接入真实 store 后替换；工具详情页只保留骨架，具体工具功能尚未开发。

![页面大纲](./docs/preview/overview.png)

| 页面 | 内容 | 预览 |
| --- | --- | --- |
| 今天 | 问候与日期、今日概览、常用工具快捷入口、本周小结 | [`today.png`](./docs/preview/today.png) |
| 工具 | 搜索、我的常用、分类筛选、工具列表 | [`tools.png`](./docs/preview/tools.png) |
| 待办 | 完成度概览、分类筛选、今天 / 明天分组 | [`tasks.png`](./docs/preview/tasks.png) |
| 我的 | 用户信息、数据统计、设置入口、退出登录 | [`profile.png`](./docs/preview/profile.png) |
| 工具详情 | 标题栏 + 留白占位，等待具体功能填充 | [`tool-detail.png`](./docs/preview/tool-detail.png) |

设计语言：浅薄荷到近白的竖向渐变背景、白色圆角卡片、深靛蓝标题、`#2CAE73` 主色与马卡龙色系图标底色；四个 Tab 在亮色 / 暗色下都有对应取值。预览图由真实组件渲染导出，仅作为版式参考。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 语言 | TypeScript 5.3，`strict: true`，统一使用 `@/` 别名 |
| 客户端 | Expo SDK 52 + React Native 0.76 + React 18 |
| 状态管理 | zustand 5 |
| 后端 | Supabase Auth + Postgres + RLS |
| 路由 | React Navigation 7（native-stack + bottom-tabs） |
| 本地存储 | `@react-native-async-storage/async-storage` |
| 测试 | Jest + jest-expo + React Native Testing Library |
| CI | GitHub Actions |

## 目录结构

```text
dayweave
├─ src/
│  ├─ components/    通用 UI 组件
│  ├─ domain/        与框架无关的纯函数与业务规则
│  ├─ hooks/         跨组件复用逻辑
│  ├─ lib/           Supabase client、提示框、错误归一化
│  ├─ navigation/    路由注册与参数类型
│  ├─ screens/       页面
│  ├─ services/      Supabase 数据访问
│  ├─ stores/        zustand 全局状态
│  ├─ test/          测试替身
│  ├─ theme/         调色板、间距、圆角、字号
│  └─ types/         领域类型与数据库行类型映射
├─ .github/          CI、发布构建与缓存预热工作流；scripts/ 为 Gradle 调优脚本
├─ docs/preview/     页面大纲预览图
├─ supabase/         schema.sql 与后续 migrations
├─ App.tsx           根编排
└─ index.ts          Expo 入口
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目。
2. 打开 Dashboard → SQL Editor，执行 [`supabase/schema.sql`](./supabase/schema.sql)。
3. 在 Authentication → Providers 中启用 Email 登录，并按需选择是否开启邮箱验证。
4. 复制环境变量模板：

```bash
cp .env.example .env
```

填写 Supabase 项目地址与 Anon Key：

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

`.env` 已被 `.gitignore` 忽略。真实密钥、keystore、token 不得提交到仓库。

### 3. 启动应用

```bash
npm start
# 或直接打开指定平台
npm run web
npm run android
npm run ios
```

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm start` | 启动 Expo 开发服务器 |
| `npm run web` | 以 Web 方式启动 |
| `npm run android` | 启动 Android |
| `npm run ios` | 启动 iOS |
| `npm run typecheck` | TypeScript 严格检查 |
| `npm test` | 运行 Jest 测试 |
| `npm run check` | 类型检查 + CI 模式测试 |

提交前必须执行：

```bash
npm run check
```

## 当前数据库

`supabase/schema.sql` 当前只创建 `dw_profiles` 基础表，并包含：

- 注册后自动创建用户资料；
- `updated_at` 自动维护；
- 启用 RLS，仅允许用户读写自己的资料；
- 最小权限授权。

### 表名前缀约定

同一个 Supabase 项目会被多个应用共用，因此本项目的数据库对象**统一使用 `dw_` 前缀**：表名（`dw_profiles`）、策略（`dw_profiles_select_own`）、触发器（`dw_on_auth_user_created`）、函数（`dw_set_updated_at`）都带前缀，避免和其他项目在同库内重名。命名细节见 [`AGENTS.md`](./AGENTS.md) 的 3.3 节。

新增业务表时：

1. 写入 `supabase/migrations/<timestamp>_<name>.sql`；
2. 同步更新 `supabase/schema.sql`；
3. 表名使用 `dw_<业务>`，策略 / 触发器 / 函数同样带 `dw_` 前缀；
4. 为表启用 RLS 并编写策略；
5. 需要实时同步时再加入 `supabase_realtime` publication。

## 构建与发布

Android APK 完全在 GitHub Actions Runner 上构建，**不依赖 Expo / EAS 账号**：CI 内先 `expo prebuild` 生成原生工程，再用 Gradle 打包并签名。JDK 17 与 Android SDK 由 Runner 自带。这套流程与同级项目 `family-piggy` 保持一致。

CI 工作流：

| 工作流 | 触发 | 内容 |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | push / PR 到 `main` | `npm ci` → `npm run typecheck` → `npm test -- --ci` |
| [`.github/workflows/warm-android-cache.yml`](./.github/workflows/warm-android-cache.yml) | 依赖 / 配置变更或手动触发 | 在 `main` 作用域预热 Gradle 缓存 |
| [`.github/workflows/release.yml`](./.github/workflows/release.yml) | 推送 `v*` 标签或手动触发 | 构建、签名并发布 Android APK |

### 触发方式与产物

```bash
# 正式发布：推送 annotated tag
git tag -a v0.1.0 -m "v0.1.0：一句话主题

- 用户可感知的改动"
git push origin v0.1.0
```

| 触发方式 | 发布标签 | 说明 |
| --- | --- | --- |
| 推送 `v*` 标签 | 该标签（如 `v0.1.0`） | 正式 Release |
| 手动 Run workflow | `build-<run_number>` | 预发布，便于随时获取安装包 |

产物发布在仓库 **Releases** 页面的 Assets 中，文件名形如 `dayweave-<tag>.apk`，可直接点击下载安装，无需解压。同一标签重跑会覆盖同名资产。

### 环境变量与版本号注入链路

```text
GitHub Secrets
  └─ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
       └─ Gradle assembleRelease 触发 Metro 打包时内联进 bundle

github.run_number → ANDROID_VERSION_CODE → app.config.js 的 android.versionCode（每次构建递增）
tag v0.1.0        → APP_VERSION          → app.config.js 的 version（去掉 v 前缀）
```

签名不走「修改 build.gradle」，而是用 Gradle 官方注入属性（与 Android Studio 同款）在 `assembleRelease` 命令行传入，prebuild 生成的工程保持原样：

```bash
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file="$KEYSTORE_FILE" \
  -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEYSTORE_PASSWORD"
```

PKCS12 keystore 的 key 密码与 store 密码相同，因此只需要一个密码 Secret。

<details>
<summary><strong>首次打包一次性准备：keystore + GitHub Secrets</strong></summary>

1. **签名 keystore**：本项目已生成一把放在本地 `.secrets/`（见 `.secrets/android-signing-credentials.txt`），别名 `dayweave`，务必自行离线备份；丢失后无法覆盖升级已安装的 App。如需自行重新生成：

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias dayweave \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **将 keystore 转为 Base64（单行）**：

```bash
# macOS / Linux
base64 -w0 release.keystore

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore"))
```

keystore 已被 `.gitignore` 忽略（`*.keystore` / `*.jks` / `.secrets/`），不要提交。

3. **在 GitHub 仓库 Settings → Secrets and variables → Actions 配置 5 个 Secrets**：

| Secret | 说明 |
| --- | --- |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |
| `ANDROID_KEYSTORE_BASE64` | keystore 的 Base64 单行文本 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码（PKCS12 下 key 密码与其相同） |
| `ANDROID_KEY_ALIAS` | keystore 别名（本项目为 `dayweave`） |

> `SUPABASE_*` 会被内联进客户端 bundle，属公开信息；**真正需要保密的是 keystore 与其密码**。

4. **应用图标与原生开屏**：目前 `app.config.js` 还没有配置 `icon` / `android.adaptiveIcon` / `expo-splash-screen`，构建会使用 Expo 默认图标与开屏。补图后需要重新构建才生效。

</details>

<details>
<summary><strong>构建失败排查</strong></summary>

| 现象 | 原因与处理 |
| --- | --- |
| `Plugin [id: 'expo-module-gradle-plugin'] was not found` | `node_modules` 混入其他 SDK 版本的原生模块；运行 `npx expo install --check`，再用 `npx expo install <包名>` 装回期望版本 |
| `Could not get unknown property 'release' for SoftwareComponent container` | 通常是上一条版本错配的连带报错，依赖对齐后消失 |
| APK 仍是 debug 签名 | keystore Secrets 未生效，检查 `ANDROID_KEYSTORE_BASE64` / 密码 / 别名；工作流里的 `校验 APK 签名` 步骤会直接失败 |
| 发布构建卡在下载 `gradle-*-all.zip` | 到 Actions 手动触发一次 **Warm Android Cache**，或 push `package.json` / `package-lock.json` 预热 main 缓存 |

</details>

> 发布工作流需要 `contents: write` 权限来创建 Release（已在 `release.yml` 中声明）。若仓库或组织策略将默认 `GITHUB_TOKEN` 限制为只读，请到 Settings → Actions → General → Workflow permissions 调整为 “Read and write permissions”。

> 当前 CI 只产出 **Android APK**。AAB（上架 Google Play）与 iOS 正式包尚未接入：iOS 必须 Apple 付费开发者账号 + macOS Runner，AAB 需要补一条 `bundleRelease` 流水线。

## 架构约定

依赖方向：

```text
screens ──► stores ──► services ──► lib/supabase
   │           │           │
   └───────────┴───────────┴──► domain
                                types / theme
```

- `domain/` 只放纯函数，不依赖 React、Supabase 或 store；
- `services/` 是唯一允许直接访问 Supabase 的业务层；
- `stores/` 负责状态编排，不写 SQL，不直接调用 Supabase；
- `screens/` 只做交互与页面编排，复杂计算下沉；
- 数据库行类型只在 `types/db.ts` 定义并统一转换；
- UI 颜色、间距、字号统一从 `theme/` 取，不散落硬编码。

更详细的开发规则见 [`AGENTS.md`](./AGENTS.md)。

## 测试

```bash
npm test
npm run test:watch
```

测试必须离线、确定、快速。纯逻辑、service、store 的新增或修改必须补测试；bug 修复必须补回归测试。

## 后续方向

以下只是生活助手可生长的方向，不代表当前已实现：

- 日程与提醒；
- 习惯与目标；
- 随记与灵感；
- 每日回顾与统计；
- 多设备同步与离线缓存。

功能落地前先更新本文档、数据库迁移与 `AGENTS.md` 中相关约定，避免工程结构与产品方向脱节。

## 安全说明

- 客户端只使用 Supabase Anon Key，service role key 绝不进入 App；
- 所有用户数据表必须启用 RLS；
- 不提交 `.env`、真实用户数据、调试响应转储、签名文件；
- 涉及删除等危险操作时，界面必须二次确认。
