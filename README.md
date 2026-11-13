# SkyCast

一个跨端天气应用（iOS 真机 + Web）：搜索地点、查看实况与预报、管理多地点。无登录、无后端，数据来自 Open-Meteo 免费接口，偏好与缓存全部保存在本地。

技术栈是 Expo SDK 58 + React Native + TypeScript，一份代码同时跑 iOS 和浏览器。

---

## 功能

**地点**

- 搜索城市并添加，最多保存 20 个（GPS 项不计入）
- GPS 定位，反查城市名；反查失败时降级显示「当前位置」
- 底部圆点导航切换地点，选中项实心、未选中半透明
- 地点、上次选中项持久化，重启后恢复

**天气**

- 实况：温度、当日高低温、天气描述
- 逐小时 24 小时，横向滚动，当前小时起算
- 15 日预报：日期、天气图标、最低~最高温
- 空气质量：US EPA AQI 数值、六档等级、色带当前位置指针
- 六项指标：风速与阵风、降水量与今日累计、UV 指数、体感温度、湿度、日出日落

**交互与系统**

- 下拉刷新，展示数据更新时间
- 三语：简体中文、繁体中文、英文，默认跟随系统
- 主题：亮色、暗色、跟随系统
- 骨架屏、分级错误页、离线缓存（24 小时）

---
## 视频演示
https://github.com/user-attachments/assets/1c8e9495-f94b-461b-a5e1-3b3a2c4840cf

---

## 关键取舍

| 决策     | 选择                       | 放弃的方案             | 理由                                                                                 |
| ------ | ------------------------ | ----------------- | ---------------------------------------------------------------------------------- |
| 运行方式   | Expo Go                  | development build | 零构建，改代码即刷新，真机验证成本最低。Expo Go 只支持 Expo SDK 内置的原生库，一旦需要自定义原生模块就得切到 development build。 |
| UI 库   | React Native Paper v5    | Tamagui、gluestack | MD3 组件开箱可用，无编译期依赖。代价是样式自由度低，用设计 token + `GlassCard` 补齐视觉                           |
| 路由     | 单屏 `App.tsx` + 浮层        | expo-router       | 只有一个主界面和两个浮层，路由带来的深链与返回栈没有收益，反而多一层结构                                               |
| 地点选择   | 搜索                       | 国家→省→市→区层级浏览      | Open-Meteo 没有「按国家列城市」的接口，做层级需要内置静态数据集。省/国家保留为结果标签                                  |
| 天气请求   | 单地点单请求                   | Open-Meteo 多坐标批量  | 批量会让错误耦合（一个坐标失败污染整批），也无法独立呈现每个地点的加载态。20 个地点用不上批量优化                                 |
| 温度单位   | 仅摄氏度                     | 摄氏/华氏换算           | API 固定返回 metric，砍掉换算省去一整层偏好状态与全部换算分支                                               |
| 反向地理编码 | 独立模块 + 降级链               | 直接写在定位 hook 里     | 天气 API 对它零感知，供应商可替换；失败不阻断看天气                                                       |
| GPS 地点 | 每次启动重新定位，不缓存             | 持久化坐标             | 避免把上次的位置当成「当前位置」，也避免过期坐标长期占位                                                       |
| 全局状态   | Context + TanStack Query | Redux、Zustand     | 本地状态只有地点列表与偏好两块，无跨模块写入，引入状态库是净负担                                                   |
| 背景     | 四套固定渐变                   | 按天空色动态取色          | 动态取色需要额外图像处理，tokens 中配置四套（晴/阴 × 昼/夜）表达天气差异                                         |

---

## 技术栈

| 模块    | 选型                              | 版本                  |
| ----- | ------------------------------- | ------------------- |
| 应用框架  | Expo SDK                        | `expo ~58.0.24`     |
| UI 框架 | React Native / React            | `0.88.1` / `19.3.0` |
| 语言    | TypeScript（strict）              | `~6.0.3`            |
| UI 库  | React Native Paper（MD3）         | `5.15.4`            |
| 服务端状态 | TanStack Query + persist client | `^5.107.1`          |
| 运行时校验 | zod                             | `^4.6.7`            |
| i18n  | i18next + expo-localization     | `^27.1.1`           |
| 本地存储  | AsyncStorage                    | `^1.23.1`           |
| 定位    | expo-location                   | `~58.0.21`          |
| 测试    | vitest                          | `^5.1.0`            |

数据源：

- 天气与预报 `api.open-meteo.com`
- 空气质量 `air-quality-api.open-meteo.com`
- 正向地理编码 `geocoding-api.open-meteo.com`
- 反向地理编码 `api.bigdatacloud.net`，备用 `nominatim.openstreetmap.org`

---

## 如何运行

### 前置

- Node.js ≥ 22.13（Expo 58 工具链要求）
- pnpm
- iPhone 上安装 Expo Go（App Store），版本需为 58.x

### 安装与启动

```bash
pnpm install

pnpm web        # 浏览器，最快看到界面
pnpm start      # Expo 开发服务器，供 Expo Go 扫码
```

### iOS 真机

1. 终端执行 `pnpm start`，会输出二维码和 `exp://<局域网IP>:8081`
2. Mac 与 iPhone 连同一个 Wi-Fi
3. iPhone 用相机扫码，选择「在 Expo Go 中打开」；扫不出就用 Expo Go 首页的「Enter URL manually」
4. 首次进入需要登录 Expo 账号：Mac 端 `pnpm exec expo login`，iPhone 端在 Expo Go 里登录**同一个账号**
5. 首次 bundle 需要 30–90 秒，之后保存代码会自动刷新

### 校验命令

```bash
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm test       # vitest run，89 个纯函数用例
pnpm probe      # 用 Node 直连 Open-Meteo，核对字段名与数组长度
```

`pnpm probe` 是独立的接口探针，直连 Open-Meteo 核对字段名与数组长度——当天气数据出现异常时，先跑它确认接口契约有没有变，再判断问题在代码还是数据。

单元测试（vitest，`tests/unit/`）只覆盖不依赖 React Native 的纯函数：WMO 码映射、AQI / UV 分级、时区换算、数值格式化、行政区后缀清洗、语言归一与搜索去重。组件、hooks 与网络层不测——需要 RN 运行时或 mock，收益低于成本，靠手工清单覆盖。

---

## 设计说明

### 1. 应用架构

**分层是单向的：`components → features → services`，`lib` 与 `types` 被各层引用，自身不依赖任何上层。**

```plaintext
App.tsx                      Provider 组装：SafeArea → QueryPersist → Settings → Locations
src/
  features/
    weather/                 WeatherScreen（编排）+ useWeather（查询编排）
    locations/               LocationsContext、LocationSheet 系列、定位与搜索 hooks
    settings/                SettingsContext + SettingsPanel
  components/
    weather/                 WeatherHero、HourlyStrip、DailyForecastCard、AqiCard、
                             MetricCard、GlassCard、WeatherBackground、
                             WeatherSkeleton、WeatherErrorView
    locations/               LocationDots
    ui/                      FloatingIconButton、Shimmer
  services/
    api/                     http（超时/状态码）、errors（归一）、openMeteo（三组端点）、
                             reverseGeocode（适配器 + 降级链）
    query/                   queryClient（重试策略）、persister（离线缓存）
    storage/                 AsyncStorage 薄封装，统一前缀
  lib/                       纯函数：time、wmo、aqi、uv、format、geo、location
  i18n/                      index + 三份语言包 + locale 归一
  theme/                     tokens + MD3 light/dark
  types/                     Location、Weather 等共享模型
```

约束：

- **UI 不发请求**。组件只接收已成形数据，取数在 `features/*/use*.ts` 里。
- **service 不引入 React**。`services/` 下没有 hook、没有 JSX，输入输出都是普通数据，因此可以被 Node 脚本直接跑通——数据层不必先启动 App 才能验证。
- **`lib/` 只放纯函数**。不读全局状态、不依赖平台 API，输入输出可预测。

### 2. 组件设计

**展示组件只负责「给定数据怎么长」，容器组件只负责「数据从哪来、状态怎么切」。**

| 组件                  | 职责                          | 关键设计                                  |
| ------------------- | --------------------------- | ------------------------------------- |
| `WeatherScreen`     | 页面编排：加载/错误/内容三种分支、区块组装、下拉刷新 | 不含样式细节，只决定渲染顺序与间距；离线由缓存承担，不单独设一个「离线态」 |
| `WeatherHero`       | 地点名、温度、高低温、天气描述             | 地点名过长时单行省略；区域名与城市名重复时不拼接              |
| `GlassCard`         | 统一卡片外观（圆角 20、1px 描边、半透明底）   | `tone` 控制背景强度，不改变子元素可读性               |
| `MetricCard`        | 六项指标复用                      | 标题/主值/补充说明三段式，六个调用点零重复                |
| `AqiCard`           | AQI 数值、等级、六段色带、位置指针         | 无数据时只显示「暂无数据」，不占位报错                   |
| `DailyForecastCard` | 15 日列表                      | 行高固定 40，天气图标居中列                       |
| `WeatherSkeleton`   | 骨架屏                         | 结构与成功态一致，避免加载完成后布局跳动                  |

### 3. 状态管理

**状态按来源分三类，各自的存放位置不重叠。**

| 类型      | 例子                       | 存放                     | 生命周期                        |
| ------- | ------------------------ | ---------------------- | --------------------------- |
| 服务端状态   | 天气、空气质量、搜索结果、反查结果        | TanStack Query 缓存      | 由 `staleTime` / `gcTime` 控制 |
| 持久化本地状态 | 地点列表、选中地点、语言、主题          | Context + AsyncStorage | 跨会话                         |
| 派生/瞬时状态 | 面板是否打开、搜索框输入、Snackbar 文案 | 组件 `useState`          | 组件卸载即消失                     |

**缓存策略**

| Query | Key                             | staleTime  | 说明                                        |
| ----- | ------------------------------- | ---------- | ----------------------------------------- |
| 天气    | `["weather", lat4, lon4]`       | 10 min     | 坐标先 round 到 4 位小数（物理距离约 11米），避免浮点抖动造成缓存碎片 |
| 空气质量  | `["air", lat4, lon4]`           | 10 min     | 与天气分开，失败互不影响                              |
| 搜索    | `["geocode", keyword, lang]`    | 5 min      | key 含语言，切语言不串结果                           |
| 反查    | `["reverse", lat4, lon4, lang]` | `Infinity` | 同坐标同语言结果恒定，按幂等处理                          |

缓存通过 `PersistQueryClientProvider` 写入 AsyncStorage，保留 24 小时；`gcTime` 与之对齐，避免查询在磁盘缓存还有效时就被内存回收。

### 4. API 集成

**所有网络请求走同一个入口，所有响应在边界处校验，所有错误归一成一种类型。**

```
组件 → hook（useQuery） → service（fetchForecast / searchLocations / reverseGeocode）
                              ↓
                        fetchJson（8s 超时、状态码、JSON 解析）
                              ↓
                        zod safeParse（字段校验）
                              ↓
                        AppError（network / timeout / http / schema）
```

几个关键设计：

- **统一入口&#x20;**`services/api/http.ts`：超时、状态码、错误归一都收在 `fetchJson` 一处；返回值是 `unknown`，调用方必须用 zod 收窄——接口改了字段不会静默通过。
- **查询编排&#x20;**`features/weather/useWeather.ts`：天气与空气质量是两个独立 query，后者失败只让 AQI 卡片显示「暂无数据」。
- **时区处理&#x20;**`lib/time.ts`：Open-Meteo 返回的是地点当地的壁钟时间（无时区后缀），直接 `new Date(iso)` 会按设备时区解释，在北京看纽约会错 12 小时；全程用 `Intl.DateTimeFormat` 显式指定 `timeZone`，不用 Date 的本地时区 getter。
- **多语言地名&#x20;**：Open-Meteo 的名称索引按语言隔离，搜索时无法并行取双语；保存后按 geocoding id 调 `/v1/get` 补全缺失语言，后台串行执行，失败保留原文。
- **反向地理编码**：`services/api/reverseGeocode/` 是独立适配器，与天气 API 解耦。BigDataCloud → Nominatim → null 串行降级；返回 `null` 时显示「当前位置」，不影响天气主流程。

### 5. 代码组织

**目录按「职责」划分，不按「文件类型」划分。**

| 目录            | 放什么                    | 不放什么                 |
| ------------- | ---------------------- | -------------------- |
| `components/` | 可复用的展示组件               | 数据请求、业务规则            |
| `features/`   | 一个功能域的容器、Context、hooks | 跨域复用的基础组件            |
| `services/`   | 网络、存储、查询客户端            | React 相关代码           |
| `lib/`        | 纯函数与映射表                | 状态、副作用、平台 API        |
| `types/`      | 跨层共享的数据模型              | 只在 service 内部使用的中间类型 |
| `theme/`      | 设计 token 与主题           | 组件样式                 |

几条具体规则：

- **只有被两个以上文件用到，才提取为常量**。
- **类型不跨层泄漏**。zod schema 推导出的响应类型只在 `services/` 内部使用，向上暴露的是 `WeatherBundle`、`Location` 这类领域模型。
- **命名与文件一致**。`WeatherHero.tsx` 导出 `WeatherHero`；hook 以 `use` 开头；纯函数用动词开头（`formatPrecipitation`、`cleanAdminName`）。
- **不写桶文件（index.ts 统一导出）**。直接按路径 import，依赖关系一眼可见，也避免循环引用。

### 6. 错误处理

`AppError` 只有六种 code：


| code      | 触发                   | 重试             | 呈现                                |
| --------- | -------------------- | -------------- | --------------------------------- |
| `network` | fetch 抛 `TypeError`  | 是（指数退避，最多 2 次） | 整页错误 + 重试按钮                       |
| `timeout` | 8 秒未返回               | 是              | 同上                                |
| `http`    | 非 2xx；5xx 重试，4xx 不重试 | 视状态码           | 整页错误，429 给「服务繁忙」                  |
| `schema`  | zod 校验失败 / JSON 非法   | 否（重试也不会变）      | 「数据异常」                            |
| `empty`   | 预留：接口返回空集合时使用        | 否              | 空态文案（当前搜索与预报用空数组表达无结果，尚未抛出此 code） |
| `unknown` | 其余                   | 否              | 兜底文案                              |

重试策略集中在 `services/query/queryClient.ts` 的 `shouldRetry`：只有网络、超时、5xx 才重试，延迟 1s → 2s → 4s 封顶。4xx 和 schema 错误重试没有意义，只会让用户多等几秒。

**呈现分四个层次**，不是所有错误都弹全局提示：

1. **整页**：天气主数据完全拿不到 → `WeatherErrorView`，按 code 给不同文案 + 重试
2. **区块降级**：空气质量失败 → AQI 卡片显示「暂无数据」，其余照常
3. **静默降级**：反查失败 → 地点名显示「当前位置」；存储写入失败 → 忽略，不影响当前会话
4. **空态**：搜索无结果、预报数组为空 → 文案提示，不当作错误

`WeatherErrorView` 只根据 `AppError.code` 和 `status` 映射文案，不解析服务端返回的文本——第三方接口的文案不可控，也不该直接展示给用户。

### 7. 可维护性

- **TypeScript strict**，边界用 `unknown` + zod 收窄，不写 `any` 和断言绕过
- **单一网络入口、单一错误类型**：新增接口只需要写 `fetch + schema + 映射`，超时与错误归一是现成的
- **纯函数集中在 `lib/`**：不依赖 RN，单测直接跑在 Node；`pnpm probe` 独立校验接口契约
- **三份语言包结构一致**，缺 key 会显示英文 fallback，在页面上很显眼，等于免费的缺失检测
- **设计 token 收口在 `theme/`**，改视觉是改一处而不是全局搜索替换
- **注释只解释「为什么」**：为什么坐标 round 到 4 位、为什么 GPS 项不落盘、为什么反查独立成模块——代码本身能说明「做了什么」，容易改错的是背后的取舍

---

## 已知限制

- **中文区县搜不到**：Open-Meteo 的中文索引只覆盖主要城市，是数据源边界
- **英文行政区名经过清洗**：GeoNames 写作 `Guangdong Sheng`，展示层去掉后缀显示 `Guangdong`
- **没有手势切换地点**：需要把单页结构拆成 pager，本次放弃此方案
- **无后端、无同步**：无登录态前提下的取舍，数据只存本机
- **城市名反查用的是免费公益接口，不稳定**：两个供应商都可能挂，挂了就显示「当前位置」，天气功能不受影响
- **只支持摄氏度**
