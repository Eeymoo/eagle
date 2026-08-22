import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
const DESKTOP_MIN = 768;
/** Bottom bar (mobile) / left rail (desktop) shell navigation. */
export function AppShellNav({ items, activeId }) {
    const { width } = useWindowDimensions();
    const desktop = width >= DESKTOP_MIN;
    return desktop ? _jsx(NavRail, { items: items, activeId: activeId }) : _jsx(NavTabs, { items: items, activeId: activeId });
}
function NavRail({ items, activeId }) {
    return (_jsxs(View, { style: styles.rail, accessibilityRole: "menubar", children: [_jsx(Text, { style: styles.railBrand, children: "Eagle" }), _jsx(View, { style: { gap: 4, marginTop: 18 }, children: items.map((it) => (_jsx(NavItemButton, { item: it, active: it.id === activeId, shape: "rail" }, it.id))) })] }));
}
function NavTabs({ items, activeId }) {
    return (_jsx(View, { style: styles.tabs, accessibilityRole: "menubar", children: items.map((it) => (_jsx(NavItemButton, { item: it, active: it.id === activeId, shape: "tab" }, it.id))) }));
}
function NavItemButton({ item, active, shape }) {
    return (_jsxs(Pressable, { onPress: item.onPress, accessibilityRole: "button", accessibilityState: { selected: active }, style: ({ pressed }) => [
            shape === 'rail' ? styles.railBtn : styles.tabBtn,
            active && (shape === 'rail' ? styles.railBtnActive : styles.tabBtnActive),
            pressed && styles.pressed,
        ], children: [item.glyph ? _jsx(Text, { style: shape === 'rail' ? styles.railGlyph : styles.tabGlyph, children: item.glyph }) : null, _jsx(Text, { style: [shape === 'rail' ? styles.railLabel : styles.tabLabel, active && styles.labelActive], numberOfLines: 1, children: item.label }), active && shape === 'rail' ? _jsx(View, { style: styles.railIndicator }) : null] }));
}
/** Page container: rail/tabs + content, wired by the head. */
export function AppShellLayout({ nav, children }) {
    const { width, height } = useWindowDimensions();
    const desktop = width >= DESKTOP_MIN;
    return (
    // minHeight from the window so absolutely-positioned mobile tabs can
    // anchor to the real viewport bottom even with short content.
    _jsxs(View, { style: [styles.shell, { minHeight: height }], children: [nav, _jsx(View, { style: [styles.content, !desktop && styles.contentMobile], children: children })] }));
}
const styles = StyleSheet.create({
    shell: { flex: 1, flexDirection: 'row', backgroundColor: '#0e1116' },
    content: { flex: 1, backgroundColor: '#0e1116' },
    contentMobile: { marginBottom: 64 }, // keep content clear of the bottom tabs
    // Desktop rail
    rail: {
        width: 168, paddingTop: Platform.select({ web: 20, default: 44 }), paddingHorizontal: 12,
        backgroundColor: '#101419', borderRightWidth: 1, borderRightColor: '#1d232d',
    },
    railBrand: { color: '#fff', fontSize: 18, fontWeight: '700', paddingLeft: 10 },
    railBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderRadius: 10, position: 'relative',
    },
    railBtnActive: { backgroundColor: 'rgba(91,137,255,0.14)' },
    railIndicator: {
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: '#5b89ff',
    },
    railGlyph: { color: '#8b93a1', fontSize: 15 },
    railLabel: { color: '#aeb6c2', fontSize: 14 },
    // Mobile tabs
    tabs: {
        position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row',
        backgroundColor: 'rgba(13,16,21,0.96)', borderTopWidth: 1, borderTopColor: '#1d232d',
        paddingBottom: Platform.select({ web: 8, default: 24 }), paddingTop: 6,
    },
    tabBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 10 },
    tabBtnActive: { backgroundColor: 'rgba(91,137,255,0.12)' },
    tabGlyph: { color: '#8b93a1', fontSize: 16 },
    tabLabel: { color: '#8b93a1', fontSize: 12 },
    labelActive: { color: '#fff', fontWeight: '600' },
    pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
