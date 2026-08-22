import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
const DESKTOP_MIN = 768;
/** Desktop rail width — text insets across screens use this. */
export const NAV_WIDTH = 92;
/** Bottom bar (mobile) / floating left rail (desktop) shell navigation. */
export function AppShellNav({ items, activeId }) {
    const { width } = useWindowDimensions();
    const desktop = width >= DESKTOP_MIN;
    return desktop ? _jsx(NavRail, { items: items, activeId: activeId }) : _jsx(NavTabs, { items: items, activeId: activeId });
}
/**
 * Desktop rail: icon-first vertical stack, CENTERED as a partial-height
 * floating panel (clamped between RAIL_MIN_H and RAIL_MAX_H — never the
 * full viewport column). Content renders full-bleed beneath it; only
 * text needs to keep clear (see NAV_WIDTH).
 */
function NavRail({ items, activeId }) {
    // Partial-height centered panel: clamp(280, 60% of viewport, 420).
    const { height: vh } = useWindowDimensions();
    const railH = Math.min(420, Math.max(280, Math.round(vh * 0.6)));
    return (_jsx(View, { style: [styles.rail, { height: railH, top: Math.round((vh - railH) / 2) }], accessibilityRole: "menubar", children: _jsx(View, { style: styles.railStack, children: items.map((it) => (_jsx(NavItemButton, { item: it, active: it.id === activeId, shape: "rail" }, it.id))) }) }));
}
function NavTabs({ items, activeId }) {
    return (_jsx(View, { style: styles.tabs, accessibilityRole: "menubar", children: items.map((it) => (_jsx(NavItemButton, { item: it, active: it.id === activeId, shape: "tab" }, it.id))) }));
}
function NavItemButton({ item, active, shape }) {
    return (_jsxs(Pressable, { onPress: item.onPress, accessibilityRole: "button", accessibilityState: { selected: active }, style: ({ pressed }) => [
            shape === 'rail' ? styles.railBtn : styles.tabBtn,
            active && (shape === 'rail' ? styles.railBtnActive : styles.tabBtnActive),
            pressed && styles.pressed,
        ], children: [item.icon ? (_jsx(item.icon, { size: shape === 'rail' ? 22 : 20, color: active ? '#ffffff' : '#8b93a1', strokeWidth: 1.8 })) : null, _jsx(Text, { style: [shape === 'rail' ? styles.railLabel : styles.tabLabel, active && styles.labelActive], numberOfLines: 1, children: item.label })] }));
}
/**
 * Page container: nav + content. Desktop content is FULL-BLEED (artwork may
 * run under the floating rail); text keeps clear via the NAV_WIDTH inset
 * applied here. Mobile adds bottom clearance for the tab bar.
 */
export function AppShellLayout({ nav, children, edgeToEdge = false, }) {
    const { width, height } = useWindowDimensions();
    const desktop = width >= DESKTOP_MIN;
    return (
    // minHeight from the window so absolutely-positioned nav layers can
    // anchor to the real viewport edges even with short content.
    _jsxs(View, { style: [styles.shell, { minHeight: height }], children: [nav, _jsx(View, { style: [
                    styles.content,
                    !edgeToEdge && (desktop ? styles.contentDesktop : styles.contentMobile),
                    // Player page: fixed to the screen size — no scroll, video fills.
                    edgeToEdge && { height, overflow: 'hidden', backgroundColor: '#000' },
                ], children: children })] }));
}
const styles = StyleSheet.create({
    shell: { flex: 1, backgroundColor: '#0e1116' },
    content: { flex: 1, backgroundColor: 'transparent' },
    // Desktop: text-safe inset; full-bleed art opts out with negative margins.
    contentDesktop: { paddingLeft: NAV_WIDTH },
    contentMobile: { marginBottom: 64 }, // keep content clear of the bottom tabs
    // Desktop floating rail: partial-height centered panel, not a full column.
    rail: {
        position: 'absolute', left: 0, width: NAV_WIDTH, zIndex: 10,
        justifyContent: 'center', alignItems: 'center',
        // Scrim so icons/labels stay legible over artwork; artwork shows
        // through — the rail claims no opaque background.
        backgroundColor: 'rgba(11,14,18,0.55)',
    },
    railStack: { gap: 6, alignItems: 'center' },
    railBtn: { alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, minWidth: 72 },
    railBtnActive: { backgroundColor: 'rgba(91,137,255,0.20)' },
    railLabel: { color: '#aeb6c2', fontSize: 11 },
    // Mobile tabs
    tabs: {
        position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row',
        backgroundColor: 'rgba(13,16,21,0.96)', borderTopWidth: 1, borderTopColor: '#1d232d',
        paddingBottom: Platform.select({ web: 8, default: 24 }), paddingTop: 6, zIndex: 10,
    },
    tabBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 10 },
    tabBtnActive: { backgroundColor: 'rgba(91,137,255,0.12)' },
    tabLabel: { color: '#8b93a1', fontSize: 12 },
    labelActive: { color: '#fff', fontWeight: '600' },
    pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
