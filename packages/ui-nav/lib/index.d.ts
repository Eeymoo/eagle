/**
 * @eagle/ui-nav — application shell navigation plugin.
 *
 * One nav, two shapes: a bottom tab bar on phones (thumb reach, safe-area
 * aware) and a left rail on desktop (≥768px). Pure RN syntax — identical
 * on web (RNW) and native. Heads pass items + active id + callbacks;
 * this component knows nothing about routing libraries.
 */
import React from 'react';
export interface NavItem {
    id: string;
    label: string;
    /** Single glyph from the icon policy (no emoji in chrome). */
    glyph?: string;
    onPress: () => void;
}
export interface AppShellNavProps {
    items: NavItem[];
    activeId: string;
}
/** Bottom bar (mobile) / left rail (desktop) shell navigation. */
export declare function AppShellNav({ items, activeId }: AppShellNavProps): React.JSX.Element;
/** Page container: rail/tabs + content, wired by the head. */
export declare function AppShellLayout({ nav, children }: {
    nav: React.JSX.Element;
    children: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map