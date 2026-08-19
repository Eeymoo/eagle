# 本地开发指南（沙箱/离线环境）

## pnpm 的获取

全局 pnpm 与 corepack 在本环境不可用（只读 node 目录）。仓库自带 pnpm 10.34.5：

```bash
node tools/package/bin/pnpm.cjs -v
```

## 常用命令

```bash
export PATH="/_home/Codes/Eagle/tools/bin:$PATH"   # pnpm shim（tools/bin/pnpm → pnpm.cjs）
export CI=true PNPM_HOME=/_home/Codes/Eagle/tools/pnpm-home XDG_DATA_HOME=/_home/Codes/Eagle/tools/xdg

pnpm install                                   # 安装全部 workspace 依赖
pnpm -r typecheck                              # 六包类型检查（改 core 后先 build）
pnpm --filter @eagle/core build                # 构建 core → lib/（插件 typecheck 依赖）
pnpm --filter '@eagle/*-plugin' run build      # 构建三个源插件 → lib/
pnpm --filter '@eagle/*' run test              # 运行 24 个单测
node scripts/eagle.mjs help                    # 分组命令速览
```

> 沙箱内 pnpm 首次 install 需要：
> `export PNPM_HOME=... XDG_DATA_HOME=... CI=true`（见 README §6）。

## 包结构

```
core ──► 业务契约 + 插件注册表（零平台、零具体源）
├─ jellyfin-plugin / m3u-tuner-plugin / hdhome-run-plugin ──► 源插件（依赖 core）
├─ headless-ui ──► 无头层：控制器状态机 + hooks（依赖 core；零渲染零样式）
├─ design-tokens ──► 设计令牌 → 代码生成 RN 主题 + 38 个 CSS 变量（双端同源）
├─ rn-ui-plugin ──► 纯头层：只渲染（依赖 headless-ui + design-tokens + 源插件组合）
└─ tauri-ui-plugin ──► 预留纯头层（复用 headless-ui 控制器 + tokens CSS）
```

- `@eagle/core` — 契约（SourcePlugin/LiveSource/Port/SettingsStore）+ 注册表编排
- `@eagle/jellyfin-plugin` / `m3u-tuner-plugin` / `hdhome-run-plugin` — 源插件
- `@eagle/headless-ui` — 无头控制器：ChannelList / AddSourceForm / Player / Sources
- `@eagle/design-tokens` — tokens.ts 单一事实来源；`pnpm --filter @eagle/design-tokens build` 重新生成
- `@eagle/rn-ui-plugin` — 纯头：屏幕零数据逻辑，样式全走 theme tokens
- `@eagle/tauri-ui-plugin` — 占位 + 接入契约（见包内 index.ts）
- `@eagle/mobile`（apps/mobile）— Expo 壳：入口 + metro.config + eas.json，打包见 README §5.1

## 快速打包速查

```bash
pnpm --filter @eagle/mobile start        # 开发（Metro 热更新，改 packages/ 即时生效）
pnpm --filter @eagle/mobile build:js     # JS bundle 冒烟（无 Android SDK 也可跑，适合 CI）
pnpm --filter @eagle/mobile android      # 本地 APK（需 Android SDK）
pnpm --filter @eagle/mobile apk          # EAS 云端 APK（免本地 SDK，eas login 一次）
```
