# Eagle Desktop (Tauri v2)

`@eagle/desktop-app` — 桌面外壳：Vite 前端挂载 `@eagle/tauri-ui-plugin` 的
`EagleTauriApp`，Rust 壳只负责 WebView 窗口。

## 前置条件

- Node / pnpm（仓库根 `pnpm install`）
- [Rust](https://rustup.rs)（`cargo --version` 可用）
- Linux: `webkit2gtk-4.1`、`libappindicator` 等系统库；Windows: WebView2（Win11 自带）；
  macOS: Xcode CLT

## 开发

```sh
pnpm --filter @eagle/desktop-app tauri:dev
```

（无 Rust 时纯前端调试：`pnpm --filter @eagle/desktop-app dev` → http://localhost:1420，
网络请求受浏览器 CORS 限制；Tauri WebView 内不受限。）

## 出安装包

```sh
# 首次：生成图标（需要一张 1024x1024 的 icon.png 放在 src-tauri/icons/）
pnpm --filter @eagle/desktop-app tauri icon src-tauri/icons/icon.png

pnpm --filter @eagle/desktop-app tauri:build
# 产物在 src-tauri/target/release/bundle/：dmg / msi / AppImage 等
```

## 结构

```
├─ index.html / src/main.tsx   # Vite 前端入口（仅挂载）
├─ vite.config.ts
└─ src-tauri/                  # Rust 壳（窗口 + CSP，无业务逻辑）
   ├─ tauri.conf.json
   ├─ capabilities/default.json
   └─ src/{main,lib}.rs
```
