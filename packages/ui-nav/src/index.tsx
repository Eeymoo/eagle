/**
 * @eagle/ui-nav — application shell navigation plugin.
 *
 * One nav, two shapes: a bottom tab bar on phones (thumb reach, safe-area
 * aware) and a left rail on desktop (≥768px). Pure RN syntax — identical
 * on web (RNW) and native. Heads pass items + active id + callbacks;
 * this component knows nothing about routing libraries.
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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

const DESKTOP_MIN = 768;

/** Bottom bar (mobile) / left rail (desktop) shell navigation. */
export function AppShellNav({ items, activeId }: AppShellNavProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN;
  return desktop ? <NavRail items={items} activeId={activeId} /> : <NavTabs items={items} activeId={activeId} />;
}

function NavRail({ items, activeId }: AppShellNavProps): React.JSX.Element {
  return (
    <View style={styles.rail} accessibilityRole="menubar">
      <Text style={styles.railBrand}>Eagle</Text>
      <View style={{ gap: 4, marginTop: 18 }}>
        {items.map((it) => (
          <NavItemButton key={it.id} item={it} active={it.id === activeId} shape="rail" />
        ))}
      </View>
    </View>
  );
}

function NavTabs({ items, activeId }: AppShellNavProps): React.JSX.Element {
  return (
    <View style={styles.tabs} accessibilityRole="menubar">
      {items.map((it) => (
        <NavItemButton key={it.id} item={it} active={it.id === activeId} shape="tab" />
      ))}
    </View>
  );
}

function NavItemButton({ item, active, shape }: { item: NavItem; active: boolean; shape: 'rail' | 'tab' }): React.JSX.Element {
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        shape === 'rail' ? styles.railBtn : styles.tabBtn,
        active && (shape === 'rail' ? styles.railBtnActive : styles.tabBtnActive),
        pressed && styles.pressed,
      ]}
    >
      {item.glyph ? <Text style={shape === 'rail' ? styles.railGlyph : styles.tabGlyph}>{item.glyph}</Text> : null}
      <Text style={[shape === 'rail' ? styles.railLabel : styles.tabLabel, active && styles.labelActive]} numberOfLines={1}>
        {item.label}
      </Text>
      {active && shape === 'rail' ? <View style={styles.railIndicator} /> : null}
    </Pressable>
  );
}

/** Page container: rail/tabs + content, wired by the head. */
export function AppShellLayout({ nav, children }: { nav: React.JSX.Element; children: React.ReactNode }): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN;
  return (
    // minHeight from the window so absolutely-positioned mobile tabs can
    // anchor to the real viewport bottom even with short content.
    <View style={[styles.shell, { minHeight: height }]}>
      {nav}
      <View style={[styles.content, !desktop && styles.contentMobile]}>{children}</View>
    </View>
  );
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
