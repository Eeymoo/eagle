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
/** Desktop dock width incl. its edge offset — text insets use this. */
export const NAV_WIDTH = 88;

/** Bottom bar (mobile) / floating left rail (desktop) shell navigation. */
export function AppShellNav({ items, activeId }: AppShellNavProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN;
  return desktop ? <NavRail items={items} activeId={activeId} /> : <NavTabs items={items} activeId={activeId} />;
}

/**
 * Desktop rail: icon-first vertical stack, CENTERED as a partial-height
 * floating panel (clamped between RAIL_MIN_H and RAIL_MAX_H — never the
 * full viewport column). Content renders full-bleed beneath it; only
 * text needs to keep clear (see NAV_WIDTH).
 */
function NavRail({ items, activeId }: AppShellNavProps): React.JSX.Element {
  // Floating glass dock: partial height, vertically centered, detached
  // from the screen edge. clamp(280, 60% of viewport, 420).
  const { height: vh } = useWindowDimensions();
  const railH = Math.min(420, Math.max(280, Math.round(vh * 0.6)));
  return (
    <View
      style={[styles.rail, { height: railH, top: Math.round((vh - railH) / 2) }, webGlass]}
      accessibilityRole="menubar">
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
    <View style={[styles.tabs, webGlass]} accessibilityRole="menubar">
      {items.map((it) => (
        <NavItemButton key={it.id} item={it} active={it.id === activeId} shape="tab" />
      ))}
    </View>
  );
}

function NavItemButton({ item, active, shape }: { item: NavItem; active: boolean; shape: 'rail' | 'tab' }): React.JSX.Element {
  // Desktop hover affordance (RNW mouse events; no-op on native).
  const [hover, setHover] = React.useState(false);
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        shape === 'rail' ? styles.railBtn : styles.tabBtn,
        active && (shape === 'rail' ? styles.railBtnActive : styles.tabBtnActive),
        hover && !active && styles.btnHover,
        pressed && styles.pressed,
      ]}
      /* eslint-disable-next-line */
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } : {})}
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
          // Player page: fixed to the screen size — no scroll, video fills.
          edgeToEdge && { height, overflow: 'hidden' as const, backgroundColor: '#000' },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** RNW-only frosted glass (runtime honors it; ViewStyle types lag). */
const webGlass = Platform.select({ web: { backdropFilter: 'blur(18px) saturate(140%)' } as object, default: {} as object });

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#0e1116' },
  content: { flex: 1, backgroundColor: 'transparent' },
  // Desktop: text-safe inset; full-bleed art opts out with negative margins.
  contentDesktop: { paddingLeft: NAV_WIDTH },
  contentMobile: { marginBottom: 64 }, // keep content clear of the bottom tabs
  // Desktop floating glass dock — detached from the edge, rounded pill,
  // translucent so artwork reads through, hairline border for edge
  // definition (no drop-shadow slop, no opaque slab).
  rail: {
    position: 'absolute', left: 12, width: NAV_WIDTH - 24, zIndex: 10,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(16,20,26,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  railStack: { gap: 4, alignItems: 'center' },
  railBtn: {
    alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 18, width: 56,
  },
  railBtnActive: { backgroundColor: 'rgba(91,137,255,0.22)' },
  railLabel: { color: '#98a1af', fontSize: 11, letterSpacing: 0.2 },
  // Mobile: floating pill tab bar, detached from the bottom edge —
  // same glass language as the desktop dock.
  tabs: {
    position: 'absolute', left: 16, right: 16,
    bottom: Platform.select({ web: 14, default: 30 }),
    flexDirection: 'row', zIndex: 10,
    borderRadius: 24, paddingVertical: 8, paddingHorizontal: 6,
    backgroundColor: 'rgba(16,20,26,0.82)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 7, borderRadius: 17 },
  tabBtnActive: { backgroundColor: 'rgba(91,137,255,0.22)' },
  tabLabel: { color: '#98a1af', fontSize: 12 },
  labelActive: { color: '#fff', fontWeight: '600' },
  btnHover: { backgroundColor: 'rgba(255,255,255,0.06)' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
