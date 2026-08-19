# Eagle 架构纪要（ADR 摘录）

## ADR-001 核心模块零平台依赖

**决策**：`@eagle/core` 禁止 import `react-native`、`@tauri-apps/*`、DOM、Node 专属 API。
**动机**：Cordis 式"ctx 注入"理念——业务逻辑不感知宿主环境。
**代价**：HTTP/时钟/哈希/持久化必须抽象为 `Port` / `SettingsStore` 接口。
**验证**：core 测试在纯 Node + Vitest 下运行，无任何 UI 框架。

## ADR-002 源即插件（SourcePlugin 注册表）

**决策**：core 不含任何具体直播源；Jellyfin / M3U Tuner / HDHomeRun 各自独立成包，
实现 `SourcePlugin`（kind / channelIdPrefix / connect / create），经 `core.use()` 注册。
**动机**：源是变化最频繁的维度——新增 TVHeadend、剔除某源，都不应触碰 core 与其他插件。
**依赖方向**：源插件 → core（单向）；core 零具体源 import。
**路由约定**：channel id 前缀（`jf:` / `m3u:` / `hdhr:`）即插件的 `channelIdPrefix`。
**持久化**：`PluginConnection.state` 为插件私有 opaque 状态，core 只存取不解释；
恢复时调用 `plugin.create(port, connection)` 重建。

## ADR-003 播放器隔离在屏幕层

**决策**：`react-native-video` 只出现在 `PlayerScreen.tsx`。
**动机**：Tauri 插件后续用 HTML5 video 替换时零扩散。

## ADR-004 React 胶水与渲染器无关

**决策**：`store.ts` 的 `EagleStore` + `useSyncExternalStore` 不 import react-native；
源插件经构造函数注入而非硬编码。
**动机**：Tauri（React web）可原样复用该文件，并按需组合不同插件子集。

## ADR-005 source id 由内容哈希派生

**决策**：`jellyfin:<hash(serverUrl)>`、`m3u-tuner:<hash(playlistUrl)>`、`hdhome-run:<DeviceID|hash(url)>`。
**动机**：同一 URL/设备重复添加天然去重；多源共存不冲突（曾因固定 id 导致覆盖，已修复并有回归测试）。

## ADR-006 单源失败不阻塞频道列表

**决策**：`EagleCore.listChannels` 对每个源 try/catch，失败源跳过；`addSource`
阶段 connect 失败直接报错给 UI。
**动机**：直播源普遍不稳定（设备关机、列表失效），MVP 体验优先保证可用源照常出节目。

## ADR-007 测试经 vitest alias 直连 core 源码

**决策**：各源插件 vitest `resolve.alias` 将 `@eagle/core` 指向 `../core/src/index.ts`。
**动机**：测试无需先构建 core 产物；同时 tsconfig 不用 paths（避免 rootDir 越界 TS6059），
类型检查走 `workspace:*` 的 lib 产物，二者各取所需。

## ADR-008 无头层 / 纯头层分离（headless + tokens）

**决策**：新增两个横向包：
- `@eagle/headless-ui` —— 无头层：ChannelList / AddSourceForm / Player / Sources 四个
  控制器（纯状态机类，零渲染零样式）+ 薄 React hooks + 组合根 `createEagleControllers(core)`。
- `@eagle/design-tokens` —— 设计令牌单一事实来源：`tokens.ts` 经 `build.mjs` 代码生成
  RN 主题对象（`lib/rn.ts`）与 38 个 CSS 自定义属性（`dist/tokens.css`）。

**动机**：让"行为"与"视觉"各自独立演进——行为可在纯 Node 测试（headless-ui 19 个用例
无渲染器），视觉由令牌保证跨端一致（RN 与 Tauri 消费同一份生成产物）。

**规则**：
- 控制器是纯类（subscribe/getState 形状），不 import react-native / DOM；
- hooks 只做 useSyncExternalStore 桥接，无逻辑；
- 纯头（rn-ui-plugin）屏幕零数据逻辑，样式只用 `theme.colors/spacing/radii/typography`；
- 表单结构来自 `plugin.formFields`（声明式数据），头部泛化渲染。

**收益**：Tauri 头复用控制器与令牌（CSS 变量），仅替换渲染元素（Video→video 标签），
设计一致性由构造保证而非纪律约束。
