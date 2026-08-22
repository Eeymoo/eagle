/**
 * Jellyfin-style modular media-library home: 继续观看 / 我的媒体 / 最近添加.
 * Pure-headed — data + callbacks come in as props; styling from tokens +
 * inline platform styles. Web & native share this RN-syntax component.
 *
 * Responsive: rail card sizes and type scale derive from useWindowDimensions
 * (mobile-first; ≥768px widens cards, bumps section titles, caps content at
 * 1280px). Press feedback via Pressable `pressed` (both platforms).
 * Loading shows shape-matched skeleton cards, never bare spinners.
 */
import React from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { MediaLibrary, LibraryItem } from '@eagle/core';
import type { WatchProgressEntry } from '@eagle/headless-ui';

export interface LibraryHomeScreenProps {
  /** null when no library source is configured — screen renders a hint. */
  available: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage?: string;
  libraries: MediaLibrary[];
  recent: LibraryItem[];
  continueWatching: WatchProgressEntry[];
  onPlay: (channelId: string, resumeAtSec: number) => void;
  onRemoveProgress: (channelId: string) => void;
  onOpenLibrary: (library: MediaLibrary) => void;
  onOpenSeries: (item: LibraryItem) => void;
  onBack: () => void;
}

function fmtRemaining(sec: number): string {
  const m = Math.max(1, Math.round(sec / 60));
  return m >= 60 ? `剩 ${Math.floor(m / 60)} 小时 ${m % 60} 分` : `剩 ${m} 分钟`;
}

/** Jellyfin CollectionType → glyph shown only on artwork-less fallback tiles. */
function libraryGlyph(kind: string): string {
  switch (kind) {
    case 'movies': return '电影';
    case 'tvshows': return '电视剧';
    case 'music': return '音乐';
    case 'boxsets': return '合集';
    default: return '媒体';
  }
}

/** Responsive metrics: one source of truth for rail cards + type scale. */
function useMetrics() {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  return {
    desktop,
    posterW: desktop ? 158 : 132,
    posterH: desktop ? 222 : 186,
    libCardW: desktop ? 232 : 168,
    libCardH: desktop ? 131 : 95,
    sectionTitle: desktop ? 20 : 16,
    contentMaxW: desktop ? 1280 : undefined,
  };
}

export function LibraryHomeScreen(props: LibraryHomeScreenProps) {
  const { available, status, errorMessage, libraries, recent, continueWatching, onPlay, onRemoveProgress, onOpenLibrary, onOpenSeries, onBack } = props;
  const m = useMetrics();
  const loading = status === 'loading' || status === 'idle';

  const posterCard = (item: LibraryItem) => (
    <Pressable
      style={({ pressed }) => [styles.posterCard, { width: m.posterW }, pressed && styles.cardPressed]}
      onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onPlay(item.channelId, 0))}
    >
      {item.posterUrl ? (
        <Image source={{ uri: item.posterUrl }} style={{ width: m.posterW, height: m.posterH, borderRadius: 10 }} resizeMode="cover" />
      ) : (
        <View style={[styles.posterFallbackTile, { width: m.posterW, height: m.posterH }]}>
          <Text style={styles.posterFallbackText}>{item.title.slice(0, 1)}</Text>
        </View>
      )}
      {item.kind === 'episode' && item.seriesId && (
        <View style={styles.badge}><Text style={styles.badgeText}>剧集</Text></View>
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.appBar, m.contentMaxW ? { maxWidth: m.contentMaxW, marginLeft: 'auto', marginRight: 'auto', width: '100%' } : null]}>
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && styles.cardPressed}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.brand}>Eagle 媒体库</Text>
        <View style={styles.appBarSpacer} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.body, m.contentMaxW ? { maxWidth: m.contentMaxW, marginLeft: 'auto', marginRight: 'auto', width: '100%' } : null]}>
        {status === 'error' && <Text style={styles.hint}>媒体库加载失败：{errorMessage ?? ''}</Text>}
        {available === false && status === 'ready' && (
          <Text style={styles.hint}>还没有点播媒体库。请到设置添加 Jellyfin 媒体库源。</Text>
        )}

        {/* 继续观看 */}
        {loading && continueWatching.length === 0 && libraries.length === 0 && <SkeletonRail m={m} />}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: m.sectionTitle }]}>继续观看</Text>
            <FlatList
              horizontal
              data={continueWatching}
              keyExtractor={(e) => e.channelId}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
              renderItem={({ item }) => {
                const ratio = Math.min(1, item.positionSec / Math.max(1, item.durationSec));
                return (
                  <Pressable
                    style={({ pressed }) => [styles.posterCard, { width: m.posterW }, pressed && styles.cardPressed]}
                    onPress={() => onPlay(item.channelId, item.positionSec)}
                  >
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={{ width: m.posterW, height: m.posterH, borderRadius: 10 }} resizeMode="cover" />
                    ) : (
                      <View style={[styles.posterFallbackTile, { width: m.posterW, height: m.posterH }]}>
                        <Text style={styles.posterFallbackText}>{item.name.slice(0, 1)}</Text>
                      </View>
                    )}
                    <View style={styles.progressBarWrap}>
                      <View style={[styles.progressBar, { width: `${ratio * 100}%` }]} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.progressMetaRow}>
                      <Text style={styles.cardSub} numberOfLines={1}>{fmtRemaining(item.durationSec - item.positionSec)}</Text>
                      <Pressable hitSlop={8} onPress={() => onRemoveProgress(item.channelId)}>
                        <Text style={styles.removeX}>×</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* 我的媒体 */}
        {libraries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: m.sectionTitle }]}>我的媒体</Text>
            <FlatList
              horizontal
              data={libraries}
              keyExtractor={(l) => l.id}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={6}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.libraryCard, { width: m.libCardW, height: m.libCardH }, pressed && styles.cardPressed]}
                  onPress={() => onOpenLibrary(item)}
                >
                  {item.posterUrl ? (
                    <Image source={{ uri: item.posterUrl }} style={styles.libraryBg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.libraryBg, styles.libraryBgFallback]}>
                      <Text style={styles.libraryGlyph}>{libraryGlyph(item.kind)}</Text>
                    </View>
                  )}
                  <View style={styles.libraryLabelWrap}>
                    <Text style={styles.libraryName} numberOfLines={1}>{item.name}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* 最近添加 */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: m.sectionTitle }]}>最近添加</Text>
            <FlatList
              horizontal
              data={recent}
              keyExtractor={(r) => r.channelId}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
              renderItem={({ item }) => posterCard(item)}
            />
          </View>
        )}

        {status === 'ready' && available && continueWatching.length === 0 && libraries.length === 0 && recent.length === 0 && (
          <Text style={styles.hint}>媒体库是空的。</Text>
        )}
      </ScrollView>
    </View>
  );
}

/** Shape-matched loading placeholders (skill: skeletons over spinners). */
function SkeletonRail({ m }: { m: ReturnType<typeof useMetrics> }): React.JSX.Element {
  return (
    <View style={styles.section}>
      <View style={[styles.skeletonTitle, { width: 120 }]} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ width: m.posterW }}>
            <View style={[styles.skeletonTile, { width: m.posterW, height: m.posterH }]} />
            <View style={[styles.skeletonLine, { width: m.posterW * 0.8 }]} />
            <View style={[styles.skeletonLine, { width: m.posterW * 0.5 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  appBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.select({ web: 14, default: 40 }), paddingHorizontal: 16, paddingBottom: 10, gap: 12,
  },
  back: { color: '#5b89ff', fontSize: 15 },
  appBarSpacer: { flex: 1 },
  brand: { color: '#fff', fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontWeight: '600', marginBottom: 12 },
  posterCard: { marginRight: 12 },
  posterFallbackTile: { borderRadius: 10, backgroundColor: '#1c222b', alignItems: 'center', justifyContent: 'center' },
  posterFallbackText: { color: '#8b93a1', fontSize: 28 },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  progressBarWrap: { height: 3, backgroundColor: '#2a313c', borderRadius: 2, marginTop: 6 },
  progressBar: { height: 3, backgroundColor: '#5b89ff', borderRadius: 2 },
  cardTitle: { color: '#e6e9ef', fontSize: 13, marginTop: 6 },
  cardSub: { color: '#8b93a1', fontSize: 12, marginTop: 1 },
  progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeX: { color: '#8b93a1', fontSize: 16, paddingLeft: 8 },
  libraryCard: {
    borderRadius: 12, marginRight: 12,
    backgroundColor: '#1a2029', overflow: 'hidden',
    justifyContent: 'flex-end', borderWidth: 1, borderColor: '#262d38',
  },
  libraryBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  libraryBgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2029' },
  libraryGlyph: { color: '#8b93a1', fontSize: 14 },
  libraryLabelWrap: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(10,12,16,0.72)' },
  libraryName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  badge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(91,137,255,0.9)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11 },
  hint: { color: '#8b93a1', fontSize: 14, textAlign: 'center', marginTop: 32 },
  skeletonTitle: { height: 16, borderRadius: 4, backgroundColor: '#1c222b', marginBottom: 12 },
  skeletonTile: { borderRadius: 10, backgroundColor: '#1c222b' },
  skeletonLine: { height: 11, borderRadius: 4, backgroundColor: '#1c222b', marginTop: 8 },
});
