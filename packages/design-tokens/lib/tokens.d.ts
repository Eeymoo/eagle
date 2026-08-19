/**
 * Eagle 语义设计令牌 —— 唯一事实来源（single source of truth）。
 *
 * 只描述"是什么"（surface 背景是什么颜色），不描述"怎么画"（RN 对象 / CSS 变量）。
 * build.mjs 据此生成：
 *   - lib/rn.ts            → RN 侧可直接展开进 StyleSheet
 *   - dist/tokens.css      → Web/Tauri 侧 CSS 自定义属性
 * 两端产物同源，保证设计一致性。
 */
export declare const colors: {
    readonly bgCanvas: "#0e1116";
    readonly bgSurface: "#1a2029";
    readonly bgSurfaceRaised: "#232b37";
    readonly bgOverlay: "rgba(6, 8, 12, 0.72)";
    readonly accent: "#5b89ff";
    readonly accentPressed: "#4a72e0";
    readonly danger: "#ff6b6b";
    readonly textPrimary: "#e8ecf1";
    readonly textSecondary: "#8b95a5";
    readonly textDisabled: "#5b6472";
    readonly textOnAccent: "#ffffff";
    readonly borderSubtle: "#2a3342";
};
export declare const spacing: {
    readonly none: 0;
    readonly xs: 4;
    readonly sm: 8;
    readonly md: 12;
    readonly lg: 16;
    readonly xl: 24;
    readonly xxl: 32;
};
export declare const radii: {
    readonly sm: 4;
    readonly md: 8;
    readonly lg: 12;
    readonly pill: 999;
};
export declare const typography: {
    readonly fontSizeXs: 11;
    readonly fontSizeSm: 13;
    readonly fontSizeMd: 15;
    readonly fontSizeLg: 18;
    readonly fontSizeXl: 22;
    readonly fontWeightRegular: "400";
    readonly fontWeightSemibold: "600";
    readonly fontWeightBold: "700";
};
export declare const motion: {
    readonly durationFast: 120;
    readonly durationBase: 200;
    readonly durationSlow: 320;
};
/** 屏幕断点（Web/Tauri 侧布局用；RN 侧由 useWindowDimensions 处理） */
export declare const breakpoints: {
    readonly sm: 480;
    readonly md: 768;
    readonly lg: 1024;
    readonly xl: 1280;
};
export type EagleTokens = typeof colors & typeof spacing & typeof radii;
//# sourceMappingURL=tokens.d.ts.map