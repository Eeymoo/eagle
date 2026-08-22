/**
 * @eagle/ui-nav — application shell navigation plugin.
 *
 * One nav, two shapes — both icon-first with a small text label:
 * - phones: bottom tab bar (thumb reach, safe-area aware)
 * - desktop: floating left rail over a scrim. The rail is a SAFE AREA
 *   for artwork: hero images run under it (content is full-bleed),
 *   while text avoids it via NAV_WIDTH insets.
 *
 * Pure RN syntax — identical on web (RNW) and native. Heads pass items +
 * active id + callbacks; this component knows nothing about routing.
 */
import React from 'react';
/** Icon component from @eagle/icons (lucide). Typed structurally so the
 *  web (.web.ts → lucide-react) and native (lucide-react-native) forks
 *  both satisfy it without cross-importing platform typings. */
export interface NavIconProps {
    size?: number;
    color?: string;
    strokeWidth?: number | string;
}
export type NavIcon = React.ComponentType<NavIconProps>;
export interface NavItem {
    id: string;
    label: string;
    /** lucide icon component (@eagle/icons) — icon-first, text assists. */
    icon?: NavIcon;
    onPress: () => void;
}
export interface AppShellNavProps {
    items: NavItem[];
    activeId: string;
}
/** Desktop dock width incl. its edge offset — text insets use this. */
export declare const NAV_WIDTH = 88;
/** Bottom bar (mobile) / floating left rail (desktop) shell navigation. */
export declare function AppShellNav({ items, activeId }: AppShellNavProps): React.JSX.Element;
/**
 * Page container: nav + content. Desktop content is FULL-BLEED (artwork may
 * run under the floating rail); text keeps clear via the NAV_WIDTH inset
 * applied here. Mobile adds bottom clearance for the tab bar.
 */
export declare function AppShellLayout({ nav, children, edgeToEdge, }: {
    nav: React.JSX.Element;
    children: React.ReactNode;
    /** Full-bleed pages (player): no text insets — media runs under the nav,
     *  which stays visible and hides only in element-level fullscreen. */
    edgeToEdge?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map