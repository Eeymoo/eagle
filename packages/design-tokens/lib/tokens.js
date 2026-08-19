/**
 * Eagle 语义设计令牌 —— 唯一事实来源（single source of truth）。
 *
 * 只描述"是什么"（surface 背景是什么颜色），不描述"怎么画"（RN 对象 / CSS 变量）。
 * build.mjs 据此生成：
 *   - lib/rn.ts            → RN 侧可直接展开进 StyleSheet
 *   - dist/tokens.css      → Web/Tauri 侧 CSS 自定义属性
 * 两端产物同源，保证设计一致性。
 */
export const colors = {
    // 背景层级（由远及近）
    bgCanvas: '#0e1116', // 页面画布
    bgSurface: '#1a2029', // 卡片 / 输入框 / tab 底
    bgSurfaceRaised: '#232b37', // 浮层 / 弹窗
    bgOverlay: 'rgba(6, 8, 12, 0.72)', // 播放器遮罩
    // 品牌与状态
    accent: '#5b89ff', // 主操作 / 选中态
    accentPressed: '#4a72e0',
    danger: '#ff6b6b', // 删除 / 错误
    // 文字层级
    textPrimary: '#e8ecf1',
    textSecondary: '#8b95a5',
    textDisabled: '#5b6472',
    textOnAccent: '#ffffff',
    // 边框
    borderSubtle: '#2a3342',
};
export const spacing = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};
export const radii = {
    sm: 4,
    md: 8,
    lg: 12,
    pill: 999,
};
export const typography = {
    fontSizeXs: 11,
    fontSizeSm: 13,
    fontSizeMd: 15,
    fontSizeLg: 18,
    fontSizeXl: 22,
    fontWeightRegular: '400',
    fontWeightSemibold: '600',
    fontWeightBold: '700',
};
export const motion = {
    durationFast: 120,
    durationBase: 200,
    durationSlow: 320,
};
/** 屏幕断点（Web/Tauri 侧布局用；RN 侧由 useWindowDimensions 处理） */
export const breakpoints = {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
};
//# sourceMappingURL=tokens.js.map