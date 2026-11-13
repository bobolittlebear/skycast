# SkyCast 代码规范（Claude Code 必读）

> 本文件是项目级强制约定。Claude Code 在每次改动前读取它，产出代码需逐条自检。  
> 规则用「必须 / 禁止 / 建议」区分强度；与本文件冲突的临时指令，以用户当次明确要求为准。

**项目现状**：Expo SDK 58 + React Native 0.88 + React 19.3 + TypeScript strict + React Native Paper 5 + TanStack Query 5 + zod 4 + i18next。单屏 `App.tsx`（无 expo-router），`src/` 分层，数据来自 Open-Meteo。

**常用命令**：`pnpm typecheck`、`pnpm lint`、`pnpm web`、`pnpm probe`。

---

## 1. 通用原则

1. **改前先读**：修改任何文件前，先读该文件与它的直接依赖，禁止凭文件名猜结构。
2. **最小改动**：只改与任务相关的代码，不顺手重构、不顺手改文案、不顺手升级依赖。
3. **一次一件事**：一次任务只做一类改动（数据层、UI、文案），便于回滚。
4. **依赖审批**：新增依赖必须先在回复里说明用途与替代方案，得到确认后再安装。
5. **禁止静默失败**：任何 `catch` 要么转成 `AppError` 抛出，要么返回明确兜底值并在注释写明为什么可以降级。
6. **注释只用中文**，写「为什么」不写「做了什么」（代码本身已表达做了什么）。

---

## 2. TypeScript 规范

**必须**

- `strict` 模式零错误；函数与导出的 hook 显式标注返回类型。
- 使用 `interface` 描述对象结构（可扩展），使用 `type` 描述联合类型与工具类型。
- 从 zod schema 推导 API 响应类型：`z.infer<typeof xxxSchema>`，禁止手写一份重复的 DTO。
- 领域类型集中在 `src/types/`；不要用 `.d.ts` 存放业务类型（`.d.ts` 只用于环境声明）。

**禁止**

- `any`、`as unknown as`、`@ts-ignore`。确需断言时用类型守卫（`isXxx`）并写注释。
- 可选参数滥用 `?`：能明确给默认值就给默认值。  
  |  |  |  |  
  | --- | --- | --- |
- 用 `enum`，统一用字面量联合类型（如 `type ThemeMode = 'system' | 'light' | 'dark'`）。

**命名**

| 对象       | 规则             | 示例                                  |
| -------- | -------------- | ----------------------------------- |
| 类型 / 接口  | PascalCase     | `WeatherBundle`、`Location`          |
| 组件文件     | PascalCase.tsx | `AqiCard.tsx`                       |
| 工具模块     | camelCase.ts   | `format.ts`、`wmo.ts`                |
| hook     | use 前缀         | `useWeather`、`useGeocodeSearch`     |
| 常量       | UPPER_SNAKE    | `MAX_SAVED_LOCATIONS`、`DEBOUNCE_MS` |
| i18n key | 小写点分           | `weather.dailyForecast`             |

---

## 3. React 规范

**组件写法**

- 一律函数组件，显式返回 `JSX.Element`；props 用导出 interface，命名为 `XxxProps`。
- 一个文件一个主组件；同文件内的私有子组件不导出。
- `children` 类型用 `ReactNode`；不要用 `React.FC`（会隐式带 children）。

**状态与副作用**

- **禁止在 `useEffect` 内同步 `setState`**。派生数据用计算得出，或用 `key` 重挂载代替「effect 监听 props 后 setState」。
- 异步副作用（读存储、定时器、订阅）允许在 effect 内通过回调更新 state，必须带清理函数与取消标记。
- `useMemo` / `useCallback` 只在有实际收益时使用（参与依赖数组、传给 memo 组件、列表项渲染）；不为了「看起来优化」而加。

**组件拆分阈值**（任一满足即拆）

1. 单文件超过 200 行，或 JSX 嵌套超过 4 层；
2. 同一段 JSX 结构出现两次；
3. 一个组件同时处理两种数据源或两种交互；
4. 组件开始需要超过 6 个 props。

**Context**

- 一个领域一个 Context（现为 `SettingsContext`、`LocationsContext`），导出 `useXxx`，在 Provider 外部调用时抛错而不是返回 undefined。
- Provider 必须处理 `ready` 未就绪的中间态，避免主题/语言闪烁。

---

## 4. React Native 规范

**样式**

- 一律 `StyleSheet.create`；动态样式用「静态样式数组 + 小内联对象」，禁止整块内联。
- **颜色、间距、圆角、字号必须取自 `src/theme/tokens.ts` 或 Paper theme**；组件里禁止出现 hex。
- 例外：`src/theme/tokens.ts`（token 定义）、`src/lib/aqi.ts` 与 `src/lib/uv.ts`（行业标准分级色）。
- 间距用 `gap` + `padding`，不要用连环 `marginTop` 堆叠。
- 卡片统一走 `GlassCard`，不自建同形态容器。

**布局与平台**

- 安全区一律用 `useSafeAreaInsets`，禁止硬编码 `paddingTop: 44`。
- 全屏可滚动页底部要留出悬浮按钮的高度（现为 96），避免遮挡。
- 平台差异优先用 `Platform.select` 或 `.web.tsx` / `.ios.tsx` 文件分叉；不要散落 `if (Platform.OS === 'web')`。
- Web 专属 API（`document`、`localStorage`）必须先判断 `Platform.OS === 'web' && typeof document !== 'undefined'`。

**列表与性能**

- 少于 50 项用 `map`，超过用 `FlatList`；**禁止在 `ScrollView` 内嵌同方向 `FlatList`**。
- 列表项不要内联箭头函数创建大对象；必要时提取为组件。

**交互与可访问性**

- 可点区域最小 44×44；`Pressable` 必须有可见按压反馈。
- 所有图标按钮必须给 `accessibilityRole="button"` 与 `accessibilityLabel`（用 i18n 文案）。
- 图标统一 `@expo/vector-icons` 的 `MaterialCommunityIcons`，不自绘 SVG、不引入图标包。

---

## 5. 数据与网络

- 所有请求经 `src/services/api/http.ts` 的 `fetchJson`；**组件与 hook 禁止直接 `fetch`**。
- 请求参数集中在 `services/api/openMeteo/*` 里的构造函数中，组件不拼 URL。  
  |  |  |  |  |  |  |  
  | --- | --- | --- | --- | --- | --- |
- 错误统一 `toAppError()` 归一为 `AppError`，`code` 为 `network | timeout | http | schema | empty | unknown`；UI 依据 `code` 决定文案与是否给重试。
- HTTP 超时固定 8 秒（`REQUEST_TIMEOUT_MS`），重试只在 `queryClient.ts` 的 `retry` 中定义，禁止在组件里手写重试。
- 坐标入 query key **必须 `round(4)`**，防止浮点抖动导致缓存碎片。

**Query Key 约定**

| 数据   | key                             |
| ---- | ------------------------------- |
| 天气   | `['weather', lat4, lon4]`       |
| 空气质量 | `['air', lat4, lon4]`           |
| 地点搜索 | `['geocode', query, lang]`      |
| 坐标反查 | `['reverse', lat4, lon4, lang]` |

`staleTime` 按数据性质：实况与预报 10 分钟、搜索 5 分钟、反查 `Infinity`（幂等）。

- **服务端状态不进 `useState`**；需要派生（如今天的最高温）就在渲染时算。

---

## 6. 状态管理边界

| 状态类型    | 归属             | 例子             |
| ------- | -------------- | -------------- |
| 服务端数据   | TanStack Query | 天气、空气质量、搜索结果   |
| 跨组件本地状态 | Context        | 语言与主题、地点列表与选中项 |
| 单组件瞬时状态 | `useState`     | 面板开关、输入框内容     |

规模未到需要全局状态库前，**禁止引入 zustand / redux / jotai**。

---

## 7. 常量与工具函数何时提取

**提取判断表**

| 情况                             | 处理                                  |
| ------------------------------ | ----------------------------------- |
| 同一个字面量/数字在 **2 个及以上文件**出现      | 提取为常量或 token                        |
| 只在一个组件内用一次的样式数值                | 留在组件内常量，不上提                         |
| 领域映射（天气码、AQI、UV、风向、单位）         | 提取到 `src/lib/` 纯函数，附边界处理            |
| 展示格式化（取整、百分比、风速、时间）            | 提取到 `src/lib/format.ts` 或 `time.ts` |
| 业务规则（上限 20 个地点、防抖 350ms、超时 8s） | 模块顶部 `UPPER_SNAKE` 常量并导出，便于测试引用     |
| 颜色、间距、圆角、字号                    | `src/theme/tokens.ts`，只追加不重命名       |
| 文案                             | `src/i18n/*`，禁止散落在组件里               |

**放置位置决策**

- 纯函数、无 React 依赖 → `src/lib/`
- 依赖 React 生命周期 / Query → `src/features/<domain>/useXxx.ts`
- 依赖平台能力（定位、存储）→ `src/services/`
- 纯类型 → `src/types/`
- 只被一个 feature 使用的子组件 → 该 feature 目录下，不上提到 `components/`

**反例**：把 `31.2304` 写进三个组件；把 `#2F80ED` 直接写在 `StyleSheet`；把「暂无数据」写死在 JSX 里。

---

## 8. i18n 规范

- **禁止硬编码中英文文案**（调试日志除外）；一律走 `t('key')`。
- key 命名：`weather.*`、`settings.*`、`location.*`、`aqi.level.N`、`uv.level.N`、`direction.N`。
- 三份语言包（`zh-Hans`、`zh-Hant`、`en`）**key 必须完全一致且顺序相同**；新增文案三处同时加。
- 繁体按台湾用语（設定、語言、紫外線、資料），不做「简体字直接转繁体」的机械替换。
- 句子插值用 i18next 的 `{{value}}`，禁止字符串拼接整句；数值 + 单位可拼接。
- 语言代码只有三种：`zh-Hans`、`zh-Hant`、`en`，禁止新增变体。

---

## 9. JSDoc 规范（强制）

**所有导出的组件必须写 JSDoc**：一句话说明它是什么、渲染什么数据、有什么关键行为或边界。

```tsx
/**
 * 当前空气质量卡片：六段等级色带 + AQI 数值 + 等级文案。
 * air 为 undefined 时只显示标题与「暂无数据」，不阻塞页面其余部分。
 */
export function AqiCard({ air }: AqiCardProps): JSX.Element {
```

**props 字段要逐条注释**（一眼看出单位与取值范围）：

```tsx
export interface HourlyStripProps {
  /** 从地点本地 00:00 开始的逐小时数据，长度通常为 48 */
  hourly: readonly HourlyPoint[];
  /** IANA 时区，例如 Asia/Shanghai */
  timezone: string;
  /** 当前实况的当地壁钟时间，用于定位「现在」的索引 */
  currentTime: string;
}
```

**hook 要写返回结构与缓存策略**：

```tsx
/**
 * 天气与空气质量拆成两个独立 query；air 失败只影响 air/airError。
 * 坐标按四位小数入 key，切换地点时自动复用缓存。
 */
export function useWeather(lat: number, lon: number): UseWeatherResult {
```

**不需要 JSDoc 的地方**：显而易见的一行工具函数（`roundTemp`）、内部私有小组件（可用单行 `//` 注释）。不写 `@param` / `@returns` 重复 TS 已有的类型信息。

---

## 10. 目录与导入

```
App.tsx                     单屏入口：Provider 组装 + 页面挂载
src/
  components/ui/            通用交互件（FloatingIconButton）
  components/weather/       天气领域展示件（Hero / HourlyStrip / AqiCard / DailyForecastCard / MetricCard / GlassCard / WeatherBackground）
  features/<domain>/        hooks 与页面级组合（weather、locations、settings）
  services/api/             请求与错误（http、errors、openMeteo、reverseGeocode）
  services/storage/         本地存储封装
  lib/                      纯函数（time、format、wmo、aqi、uv）
  types/                    领域类型
  theme/                    tokens 与 Paper 主题
  i18n/                     语言包与初始化
```

- 统一使用**相对路径**导入；不要混用 `@/` 别名（tsconfig 里的 paths 未在构建链路验证）。
- import 顺序：`react` → `react-native` / `expo-*` → 第三方 → 项目内部 → `import type`。
- 禁止循环依赖；下层（`lib`、`services`）不得 import 上层（`features`、`components`）。

---

## 11. 禁止事项清单

- 引入 UI 库替代 React Native Paper；引入图标包替代 `@expo/vector-icons`。
- 引入 `moment` / `dayjs` 做日期（项目统一用 `Intl` + `src/lib/time.ts`）。
- 引入 `lodash`（用原生方法或 `src/lib/` 自写）。
- 引入 `expo-router` 或任何路由库（当前是单屏 + 覆盖层）。
- 在组件里写死 API URL、坐标、颜色、文案。
- 用 `new Date("2026-11-12T20:00")` 直接格式化（必须走 `time.ts`，它按地点时区处理）。
- 用 `console.log` 留在提交里（调试完删除；`console.warn` 仅用于可恢复异常）。
- 一次改动跨越 3 个以上不相关模块。

---

## 12. 交付前自检清单

1. `pnpm typecheck` 与 `pnpm lint` 零错误。
2. 新增的导出组件有 JSDoc，props 字段有注释。
3. 新增文案在三个语言包里都存在且 key 一致。
4. 没有新增 hex、硬编码文案、硬编码坐标。
5. 没有新增 `any`、空 `catch`、同步 setState 的 `useEffect`。
6. 列表与安全区在 iOS 真机、Web 窄屏（375）都检查过。
7. 改动说明里写清「改了什么、为什么、怎么验证」。
