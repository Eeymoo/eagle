import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SettingsHubScreen({ schema, onOpenSection, onOpenPage }) {
    return (_jsxs(View, { style: styles.root, children: [_jsx(Text, { style: styles.title, children: "\u8BBE\u7F6E" }), schema.sections.map((sec) => (_jsxs(Pressable, { style: ({ pressed }) => [styles.row, pressed && styles.pressed], onPress: () => onOpenSection(sec.id), accessibilityRole: "button", children: [_jsxs(View, { style: { flex: 1, gap: 2 }, children: [_jsx(Text, { style: styles.rowTitle, children: sec.title }), sec.description ? _jsx(Text, { style: styles.rowSub, numberOfLines: 1, children: sec.description }) : null] }), _jsx(Text, { style: styles.chevron, children: "\u203A" })] }, sec.id)))] }));
}
export function SettingsSectionScreen({ section, values, onChange, onOpenPage }) {
    return (_jsxs(View, { style: styles.root, children: [_jsx(Text, { style: styles.title, children: section.title }), section.items.map((item) => (_jsx(SettingRow, { item: item, values: values, onChange: onChange, onOpenPage: onOpenPage }, 'pageId' in item ? item.pageId : item.key)))] }));
}
function SettingRow({ item, values, onChange, onOpenPage }) {
    switch (item.type) {
        case 'text':
            return (_jsxs(View, { style: styles.controlBlock, children: [_jsx(Text, { style: styles.label, children: item.label }), _jsx(TextInput, { style: styles.input, value: String(values[item.key] ?? ''), placeholder: item.placeholder, placeholderTextColor: "#5b6472", secureTextEntry: item.secure, onChangeText: (t) => onChange(item.key, t) })] }));
        case 'select': {
            const current = String(values[item.key] ?? '');
            return (_jsxs(View, { style: styles.controlBlock, children: [_jsx(Text, { style: styles.label, children: item.label }), _jsx(View, { style: styles.chipRow, children: item.options.map((o) => {
                            const active = o.value === current;
                            return (_jsx(Pressable, { onPress: () => onChange(item.key, o.value), style: ({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed], children: _jsx(Text, { style: [styles.chipText, active && styles.chipTextActive], children: o.label }) }, o.value));
                        }) })] }));
        }
        case 'toggle': {
            const on = values[item.key] === true;
            return (_jsxs(Pressable, { style: ({ pressed }) => [styles.row, pressed && styles.pressed], onPress: () => onChange(item.key, !on), accessibilityRole: "switch", accessibilityState: { checked: on }, children: [_jsxs(View, { style: { flex: 1, gap: 2 }, children: [_jsx(Text, { style: styles.rowTitle, children: item.label }), item.description ? _jsx(Text, { style: styles.rowSub, numberOfLines: 2, children: item.description }) : null] }), _jsx(View, { style: [styles.switchTrack, on && styles.switchTrackOn], children: _jsx(View, { style: [styles.switchThumb, on && styles.switchThumbOn] }) })] }));
        }
        case 'multi': {
            const selected = new Set(values[item.key] ?? []);
            return (_jsxs(View, { style: styles.controlBlock, children: [_jsx(Text, { style: styles.label, children: item.label }), _jsx(View, { style: styles.chipRow, children: item.options.map((o) => {
                            const active = selected.has(o.value);
                            return (_jsx(Pressable, { style: ({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed], onPress: () => {
                                    const next = new Set(selected);
                                    if (active)
                                        next.delete(o.value);
                                    else
                                        next.add(o.value);
                                    onChange(item.key, [...next]);
                                }, children: _jsx(Text, { style: [styles.chipText, active && styles.chipTextActive], children: o.label }) }, o.value));
                        }) })] }));
        }
        case 'page':
            return (_jsxs(Pressable, { style: ({ pressed }) => [styles.row, pressed && styles.pressed], onPress: () => onOpenPage(item.pageId), accessibilityRole: "button", children: [_jsxs(View, { style: { flex: 1, gap: 2 }, children: [_jsx(Text, { style: styles.rowTitle, children: item.label }), item.description ? _jsx(Text, { style: styles.rowSub, numberOfLines: 1, children: item.description }) : null] }), _jsx(Text, { style: styles.chevron, children: "\u203A" })] }));
    }
}
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
const styles = StyleSheet.create({
    root: { padding: 20, gap: 8, maxWidth: 720, width: '100%', alignSelf: 'flex-start' },
    title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
        backgroundColor: '#141922', borderRadius: 12, borderWidth: 1, borderColor: '#1d232d',
    },
    rowTitle: { color: '#e6e9ef', fontSize: 15 },
    rowSub: { color: '#8b93a1', fontSize: 12 },
    chevron: { color: '#5b6472', fontSize: 18 },
    controlBlock: { padding: 14, backgroundColor: '#141922', borderRadius: 12, borderWidth: 1, borderColor: '#1d232d', gap: 8 },
    label: { color: '#e6e9ef', fontSize: 15 },
    input: {
        color: '#fff', backgroundColor: '#0e1116', borderRadius: 8, borderWidth: 1, borderColor: '#2a313c',
        paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#0e1116', borderWidth: 1, borderColor: '#2a313c' },
    chipActive: { backgroundColor: 'rgba(91,137,255,0.18)', borderColor: '#5b89ff' },
    chipText: { color: '#aeb6c2', fontSize: 13 },
    chipTextActive: { color: '#fff' },
    switchTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#2a313c', padding: 3, justifyContent: 'center' },
    switchTrackOn: { backgroundColor: '#5b89ff' },
    switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
    switchThumbOn: { alignSelf: 'flex-end' },
    pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
