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
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

const DESKTOP_MIN = 768;
/** Desktop rail width — text insets across screens use this. */
export const NAV_WIDTH = 92;

/** Bottom bar (mobile) / floating left rail (desktop) shell navigation. */
export function AppShellNav({ items, activeId }: AppShellNavProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN;
  return desktop ? <NavRail items={items} activeId={activeId} /> : <NavTabs items={items} activeId={activeId} />;
}

/**
 * Desktop rail: icon-first vertical stack, vertically centered, floating
 * over a scrim. Content renders full-bleed beneath it; only text needs
 * to keep clear (see NAV_WIDTH).
 */
function NavRail({ items, activeId }: AppShellNavProps): React.JSX.Element {
  return (
    <View style={styles.rail} accessibilityRole="menubar">
      <View style={styles.railStack}>
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
      {item.icon ? (
        <item.icon
          size={shape === 'rail' ? 22 : 20}
          color={active ? '#ffffff' : '#8b93a1'}
          strokeWidth={1.8}
        />
      ) : null}
      <Text style={[shape === 'rail' ? styles.railLabel : styles.tabLabel, active && styles.labelActive]} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

/**
 * Page container: nav + content. Desktop content is FULL-BLEED (artwork may
 * run under the floating rail); text keeps clear via the NAV_WIDTH inset
 * applied here. Mobile adds bottom clearance for the tab bar.
 */
export function AppShellLayout({
  nav, children, edgeToEdge = false,
}: {
  nav: React.JSX.Element;
  children: React.ReactNode;
  /** Full-bleed pages (player): no text insets — media runs under the nav,
   *  which stays visible and hides only in element-level fullscreen. */
  edgeToEdge?: boolean;
}): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN;
  return (
    // minHeight from the window so absolutely-positioned nav layers can
    // anchor to the real viewport edges even with short content.
    <View style={[styles.shell, { minHeight: height }]}>
      {nav}
      <View
        style={[
          styles.content,
          !edgeToEdge && (desktop ? styles.contentDesktop : styles.contentMobile),
          edgeToEdge && styles.contentEdgeToEdge,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#0e1116' },
  content: { flex: 1, backgroundColor: 'transparent' },
  // Desktop: text-safe inset; full-bleed art opts out with negative margins.
  contentDesktop: { paddingLeft: NAV_WIDTH },
  contentMobile: { marginBottom: 64 }, // keep content clear of the bottom tabs
  contentEdgeToEdge: { backgroundColor: '#000' },
  // Desktop floating rail
  rail: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: NAV_WIDTH, zIndex: 10,
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
