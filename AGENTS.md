# AGENTS.md — Dayweave 开发规范
---

## 0. 工作方式

1. **先读再写**：改动前至少阅读目标文件、同目录测试，以及相关 `types` / `service` / `store`。
2. **一次只做一个完整意图**：不顺手重构无关模块，不保留临时分支、死代码或兼容双轨。
3. **TDD**：先写失败测试（红）→ 最小实现（绿）→ 在测试保护下重构（蓝）。
4. **小步验证**：每完成一个可独立验证的改动先跑相关测试；提交前必须全量通过。
5. **安全第一**：不提交真实密钥、连接串、token、用户数据或调试响应转储。
6. **不擅自操作远端**：未得到用户明确要求，不执行 `git push`、不创建 / 修改 tag、不改远端配置。
7. **产品边界**：Dayweave 是生活助手。

---

## 1. 技术栈与硬约束

| 方向 | 选型 | 硬性规则 |
| --- | --- | --- |
| 语言 | TypeScript 5.3 + strict | 禁止 `any`；确需逃逸必须注释原因；统一使用 `@/` 别名 |
| 框架 | Expo SDK 52 + React Native 0.76 | 仅函数组件 + Hooks，禁止 class 组件 |
| 状态 | zustand 5 | 全局业务状态统一放 `stores/`，不引 Redux / 业务 Context |
| 后端 | Supabase Auth / Postgres / RLS / Realtime / Storage | 连接信息只通过 `EXPO_PUBLIC_*` 注入；表名统一 `dw_` 前缀 |
| 路由 | React Navigation 7 | 路由与参数类型统一在 `navigation/` 定义 |
| 测试 | Jest + jest-expo + React Native Testing Library | 测试必须离线、确定、快速 |
| 弹窗 | `src/lib/alert.ts` / `src/lib/picker.ts` | 业务代码不直接调 `Alert.alert` / `window.alert`；禁止平台原生弹窗与日期时间选择器，统一用 `components/ui/DialogSheet` 体系 |
| 主题 | `src/theme` | 禁止在组件中散落硬编码颜色、间距、字号 |

### 依赖安装

- Expo 生态包必须使用 `npx expo install <包名>`，版本由 SDK 决定，不手写 `^`。
- 引入新依赖前先确认现有库 / 原生能力是否足够，避免增加体积与升级负担。
- 修改依赖后运行 `npx expo install --check`。

---

## 2. 项目架构

### 2.1 依赖方向（不可违反）

```text
screens ──► stores ──► services ──► lib/supabase
   │           │           │
   └───────────┴───────────┴──► domain
                                types / theme
```

### 2.2 分层职责

| 层 | 职责 | 禁止事项 |
| --- | --- | --- |
| `src/domain/` | 校验、日期、格式化、纯业务规则等纯函数 | 禁止 import React / services / stores / supabase |
| `src/services/` | Supabase 数据访问，行类型 ↔ 领域类型映射 | 禁止写 UI 状态；禁止在 services 之外直接 import supabase |
| `src/stores/` | zustand 状态，编排 services，维护 loading / error | 禁止写 SQL；禁止直接调 Supabase；禁止承载复杂业务规则 |
| `src/components/` | 通用 UI 与基础组件 | 禁止直接 import supabase；数据获取不写进基础组件 |
| `src/screens/` | 页面交互、焦点加载、导航编排 | 禁止直连 Supabase；复杂计算必须下沉 |
| `src/navigation/` | 路由注册与参数类型 | 不写业务逻辑 |
| `src/theme/` | 调色板、间距、字号、圆角、样式工具 | 禁止在组件中硬编码设计 token |
| `src/types/` | 领域类型 + DB 行类型映射 | `snake_case` 只允许出现在 DB 行类型与 `toXxx()` |
| `src/lib/` | Supabase client、提示框、错误归一化等底层工具 | 不承载业务状态 |
| `src/hooks/` | 跨 store / 组件的复用逻辑 | 不替代 store 持久状态 |
| `src/test/` | 测试替身 | 不写业务实现 |

### 2.3 新增内容放哪里

| 需求类型 | 放置位置 | 必须同步 |
| --- | --- | --- |
| 纯计算 / 解析 / 校验 | `src/domain/foo.ts` | `foo.test.ts` |
| 新字段 / 新表映射 | `src/types/db.ts` + `src/types/domain.ts` | 相关 service 测试 |
| 新数据访问方法 | 对应 `src/services/xxx.service.ts` | `xxx.service.test.ts` |
| 新全局状态 | 对应 `src/stores/xxx.store.ts` | `xxx.store.test.ts` |
| 新通用 UI | `src/components/` 或 `src/components/ui/` | 交互测试（如适用） |
| 新页面 | `src/screens/<功能>/XxxScreen.tsx` | `navigation/types.ts` + `navigation/index.tsx` |
| 新设计令牌 | `src/theme/` | 浅色 + 深色两套值 |
| 新数据库变更 | `supabase/migrations/<timestamp>_xxx.sql` | 同步 `supabase/schema.sql`；表名带 `dw_` 前缀 |

### 2.4 关键不变量

- `App.tsx` 是唯一根编排点；`auth.store.initialize()` 必须先注册会话监听，再读初始 session。
- 登出后必须清理当前用户的业务 store，不保留上一个账号的数据。
- zustand v5 selector 对「未加载 / 空数据」应返回模块级常量，保证快照引用稳定。
- 数据库行到领域对象的转换统一走 `types/db.ts`，禁止页面里手写 `snake_case` 映射。
- 所有数据库用户数据表必须启用 RLS；权限边界统一使用 `auth.uid()`。
- 所有 Dayweave 自建的数据库对象统一使用 `dw_` 前缀，保证多个项目可以共用一个 Supabase 项目。

---

## 3. 开发规范

### 3.1 TypeScript / React

- `strict: true` 已开启；禁止 `as any`、`@ts-ignore` 绕过问题。确需逃逸时使用 `as unknown as T` 或 `@ts-expect-error` 并注明原因。
- 组件必须是函数组件 + Hooks；复杂逻辑提取为纯函数或自定义 hook。
- 类型优先从 `src/types/domain.ts` 取；数据库行类型只在 `src/types/db.ts` 定义。
- 列表渲染必须提供稳定 `key`；zustand 选择器必须返回稳定引用。
- 不保留注释掉的死代码、调试日志或临时变量。

### 3.2 代码组织

- 单一职责；单文件建议不超过 300 行，超出必须拆分组件 / 函数 / hooks。
- 命名自释；禁止魔法数字与魔法字符串，统一收敛到 `theme`、`types` 或常量文件。
- **彻底改造原则**：需求变更时整体重构相关模块，改完即删旧代码、旧类型、旧测试；禁止打补丁、禁止保留旧实现做兼容。
- 注释解释「为什么」，不重复「代码做了什么」；中文注释风格保持一致。

### 3.3 数据与 Supabase

- **表名前缀**：本项目建表统一使用 `dw_<业务>` 命名（如 `dw_profiles`、`dw_work_logs`）。同一个 Supabase 项目会被多个应用共用，不带前缀的表名迟早互相冲突。
- 与之配套的策略、触发器、函数同样加 `dw_` 前缀（如策略 `dw_profiles_select_own`、函数 `dw_set_updated_at`），避免同库内与其他项目重名。
- 引用带前缀的表时，`schema.sql`、迁移脚本、`services`、`types/db.ts` 中的名字必须完全一致，不留旧名兼容。
- 给已存在的表改名时，先写 `supabase/migrations/<timestamp>_rename_xx.sql` 迁移并同步 `schema.sql`，迁移文件内要做存在性判断，保证重复执行不报错。
- `services` 是唯一允许直接 `import { supabase }` 的业务层（`lib/supabase.ts` 除外）。
- 每个 service 方法返回领域类型；错误统一 `throw new Error('<面向用户的中文文案>')`。
- `supabase/schema.sql` 是幂等初始化脚本；新表 / 新字段必须同步迁移与 schema，并写必要注释。
- 新表必须启用 RLS 并编写策略；不得为了省事使用 `using (true)` 暴露用户数据。
- 需要实时同步的表必须加入 `supabase_realtime` publication。
- 新环境变量必须同步更新 `.env.example` 与 README；真实值绝不入库。
- service role key 是服务端密钥，禁止进入客户端环境变量。

### 3.4 UI 与主题

- UI 一律使用 `src/theme` 中的颜色、间距、字号、圆角。
- 页面容器必须处理安全区；顶部栏和底部操作区要考虑键盘与不同屏幕尺寸。
- 交互测试优先使用可访问性 label，避免依赖脆弱文本或像素快照。
- 删除、退出、覆盖等危险操作必须二次确认。

### 3.5 提交与发布

- 提交信息使用 `feat / fix / refactor / test / docs / chore` 前缀，一次提交一个完整意图。
- 提交前必须通过 `npm run check`。
- 发布 tag 只写用户可感知的变化，不写实现细节。
- 不要从未经 CI 的提交直接打标签。

---

## 4. 测试规范

### 4.1 强制流程

1. **红**：先写能复现问题 / 表达需求的失败测试。
2. **绿**：写最小实现让测试通过，不做额外设计。
3. **蓝**：在测试保护下重构，保持全绿。

### 4.2 测试放置与覆盖重点

测试文件与被测文件同目录：`foo.ts` → `foo.test.ts`；组件用 `foo.test.tsx`。

| 层 | 重点 |
| --- | --- |
| `domain` | 边界值、空数据、异常输入、日期 / 格式化 / 解析 |
| `services` | 请求参数、字段映射（snake_case、null）、错误文案 |
| `stores` | 状态迁移、reset、loading / error、selector 空引用稳定 |
| `components` / `screens` | 用户交互、条件渲染、禁用态、可访问性 label |

### 4.3 测试约束

- 单元测试禁止访问真实网络 / 真实 Supabase；使用 `src/test/` 替身或 mock。
- 不写像素快照；不依赖当前时间、随机数或真实时区，必要时注入固定时间。
- 断言行为与数据，不断言实现细节。
- 全量测试用 `npm test -- --ci`。

---

## 5. 当前基线

当前仅有：

- 邮箱认证与登录态恢复；
- 用户资料读取 / 更新服务；
- 「今天 / 工具 / 待办 / 我的」导航外壳与静态页面大纲（演示数据）；
- 工具详情占位页，工具功能尚未实现；
- 亮暗主题与基础组件；
- 统一的应用内弹窗 / 确认框 / 日历 / 时间选择器组件与 Promise API（替代平台原生效果），开发态「组件预览」Tab；
- 应用内更新：检查公开 GitHub Release、经代理下载 APK、校验大小并拉起系统安装器，入口在「我的」页；
- `dw_profiles` 数据库表与 RLS。

> 不要假设尚未实现的功能存在。新增产品功能前，先明确数据模型、RLS 策略、加载态、空态、错误态和测试。
