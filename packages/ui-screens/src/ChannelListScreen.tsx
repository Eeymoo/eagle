/**
 * Pure-headed channel list: renders state from the headless controller,
 * styles from design tokens. No data fetching, no filtering logic here —
 * those live in @eagle/headless-ui.
 */
import React, { useEffect, useMemo } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Settings } from '@eagle/icons';
import type { Channel } from '@eagle/core';
import type { ChannelListController, HealthController } from '@eagle/headless-ui';
import { useChannelList, useHealth } from '@eagle/headless-ui';
import { t } from './theme.js';

export interface ChannelListScreenProps {
  controller: ChannelListController;
  health: HealthController;
  onPlay: (channel: Channel) => void;
  onOpenSettings: () => void;
}

export function ChannelListScreen({ controller, health, onPlay, onOpenSettings }: ChannelListScreenProps) {
  const state = useChannelList(controller);
  const healthState = useHealth(health);

  useEffect(() => {
    void controller.refresh().then(() => {
      // Refresh-time screening (unless disabled in settings).
      if (health.getState().checkOnRefresh) {
        void health.probe(controller.getState().channels);
      }
    });
  }, [controller, health]);

  // Memoized: re-filtering 8k channels on EVERY render (health ticks, player
  // state) produced a fresh array each time → FlatList full reconcile each
  // tick → React concurrent commit wedge (Maximum update depth). Only
  // recompute when the underlying state versions actually change.
  const visible = useMemo(
    () => health.filter(controller.visibleChannels()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, health, state.version, healthState.version, healthState.hideBad],
  );
  // Cap what the virtualizer manages — huge libraries stay scrollable but
  // bounded; searching narrows precisely.
  const shown = visible.length > 500 ? visible.slice(0, 500) : visible;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder="搜索频道"
            placeholderTextColor={t.colors.textDisabled}
            value={state.query}
            onChangeText={(q) => controller.setQuery(q)}
          />
        </View>
        <Pressable onPress={onOpenSettings} style={styles.gear} hitSlop={8} accessibilityLabel="设置">
          <Settings size={18} color="#8b93a1" strokeWidth={1.8} />
        </Pressable>
      </View>

      {state.status === 'loading' && <Text style={styles.hint}>加载中…</Text>}
      {state.status === 'error' && (
        <Text style={styles.error}>
          出错了：{state.errorMessage}
          {'\n'}
          <Text style={styles.retry} onPress={() => void controller.refresh(true)}>
            点击重试
          </Text>
        </Text>
      )}
      {visible.length > shown.length && (
        <Text style={styles.hint}>已显示前 {shown.length} 条（共 {visible.length} 条），用搜索定位其余频道。</Text>
      )}
      {state.status === 'ready' && visible.length === 0 && (
        <Text style={styles.hint}>
          {healthState.hideBad
            ? '频道都被过滤了或暂无频道。可在设置中关闭"隐藏坏台"。'
            : '没有频道。请到设置添加 Jellyfin / M3U Tuner / HDHomeRun 源。'}
        </Text>
      )}
      {healthState.inflight > 0 && (
        <Text style={styles.healthHint}>
          🔍 体检中… 剩余 {healthState.inflight} 个频道
        </Text>
      )}

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        // Big libraries (8k+ VOD items) + RNW's default virtualizer settings
        // wedge React's concurrent commit loop (Maximum update depth on any
        // navigation). Tight render window keeps it stable.
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onPlay(item)}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoFallbackText}>{item.name.slice(0, 1)}</Text>
              </View>
            )}
            <View style={styles.rowMain}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.number ? `${item.number} · ` : ''}
                {item.name}
              </Text>
              {item.group ? (
                <Text style={styles.rowGroup} numberOfLines={1}>
                  {item.group}
                </Text>
              ) : null}
            </View>
            <Text style={styles.rowSource}>{item.source}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// Desktop (react-native-web) proportions: search doesn't stretch, rows breathe.
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.bgCanvas },
  header: { flexDirection: 'row', alignItems: 'center', padding: t.spacing.md, gap: t.spacing.sm },
  searchWrap: {
    // Takes the header row minus the gear; centers the fixed-width search
    // on web. Native: wrapper fills and the input fills it.
    flex: 1,
    alignItems: isWeb ? 'center' : 'stretch',
  },
  search: {
    // Web: fixed 460px (RN's flex:0 expands to flex-basis:0% in RNW and
    // collapses the box). Native: fill the header row.
    ...(isWeb ? { width: 460 } : { flex: 1 }),
    backgroundColor: t.colors.bgSurface,
    color: t.colors.textPrimary,
    borderRadius: t.radii.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm + 2,
  },
  gear: { padding: t.spacing.sm },
  gearText: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeLg },
  hint: { color: t.colors.textSecondary, textAlign: 'center', marginTop: t.spacing.xl },
  healthHint: { color: t.colors.accent, textAlign: 'center', fontSize: t.typography.fontSizeXs, paddingVertical: t.spacing.xs },
  error: { color: t.colors.danger, textAlign: 'center', marginTop: t.spacing.xl },
  retry: { color: t.colors.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.select({ web: 14, default: t.spacing.md }),
    gap: Platform.select({ web: t.spacing.lg, default: t.spacing.md }),
    borderRadius: Platform.select({ web: 12, default: 0 }),
  },
  logo: {
    width: Platform.select({ web: 52, default: 44 }),
    height: Platform.select({ web: 52, default: 44 }),
    borderRadius: t.radii.md,
    backgroundColor: t.colors.bgSurface,
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  logoFallbackText: { color: t.colors.accent, fontWeight: t.typography.fontWeightBold },
  rowMain: { flex: 1 },
  rowName: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeMd },
  rowGroup: { color: t.colors.textSecondary, fontSize: t.typography.fontSizeSm, marginTop: 2 },
  rowSource: {
    color: t.colors.accent,
    fontSize: t.typography.fontSizeXs,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
