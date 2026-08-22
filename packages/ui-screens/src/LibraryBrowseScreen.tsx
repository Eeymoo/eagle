/**
 * Library browse screens: poster wall for one library (电影/电视剧) and
 * the series detail (episode list). Data flows in via props; the owning
 * route performs the loads. RN syntax — shared by web and native.
 *
 * Responsive: the wall's column count derives from the viewport (2 on
 * phones up to ~7 on wide desktops); paging stays 40/batch. Skeletons
 * mirror the wall's shape while loading.
 */
import React from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { LibraryItem } from '@eagle/core';

export interface LibraryBrowseScreenProps {
  title: string;
  loading: boolean;
  errorMessage?: string;
  items: LibraryItem[];
  onPlay: (channelId: string, resumeAtSec: number) => void;
  onOpenSeries: (item: LibraryItem) => void;
  onBack: () => void;
}

const PAGE = 40;
const GAP = 12;
const PAD = 16;

/** Poster wall with incremental paging (big libraries stay smooth). */
export function LibraryBrowseScreen({ title, loading, errorMessage, items, onPlay, onOpenSeries, onBack }: LibraryBrowseScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const cardW = desktop ? 158 : 124;
  const cardH = Math.round(cardW * 1.405); // 2:3 poster ratio (Jellyfin standard)
  const cols = Math.max(2, Math.min(desktop ? 7 : 3, Math.floor((width - 2 * PAD) / (cardW + GAP))));
  const [shownCount, setShownCount] = React.useState(PAGE);
  React.useEffect(() => setShownCount(PAGE), [cols]);
  const shown = items.slice(0, shownCount);

  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && styles.cardPressed}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.brand} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{items.length > 0 ? `${items.length} 项` : ''}</Text>
      </View>

      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}
      {!errorMessage && !loading && items.length === 0 && <Text style={styles.hint}>这个库是空的。</Text>}

      {loading && items.length === 0 ? (
        <View style={[styles.wall, { gap: GAP }]}>
          {Array.from({ length: cols * 4 }).map((_, i) => (
            <View key={i} style={{ width: cardW }}>
              <View style={[styles.skeletonTile, { width: cardW, height: cardH }]} />
              <View style={[styles.skeletonLine, { width: cardW * 0.8 }]} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.channelId}
          key={cols}
          numColumns={cols}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          columnWrapperStyle={{ gap: GAP, marginBottom: 18 }}
          contentContainerStyle={{ paddingHorizontal: PAD }}
          onEndReachedThreshold={0.5}
          onEndReached={() => setShownCount((c) => Math.min(c + PAGE, items.length))}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onPlay(item.channelId, 0))}
            >
              {item.posterUrl ? (
                <Image source={{ uri: item.posterUrl }} style={{ width: cardW, height: cardH, borderRadius: 10 }} resizeMode="cover" />
              ) : (
                <View style={[styles.posterFallbackTile, { width: cardW, height: cardH }]}>
                  <Text style={styles.posterFallbackText}>{item.title.slice(0, 1)}</Text>
                </View>
              )}
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

export interface SeriesScreenProps {
  title: string;
  loading: boolean;
  errorMessage?: string;
  episodes: LibraryItem[];
  /** Resume positions keyed by episode channelId (seconds, 0 = none). */
  resumeAt: Record<string, number>;
  onPlay: (channelId: string, resumeAtSec: number) => void;
  onBack: () => void;
}

/** Series detail: linear episode list with resume indicators. */
export function SeriesScreen({ title, loading, errorMessage, episodes, resumeAt, onPlay, onBack }: SeriesScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const thumbW = desktop ? 160 : 128;
  const thumbH = Math.round(thumbW * 0.5625); // 16:9 stills

  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && styles.cardPressed}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.brand} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{episodes.length > 0 ? `${episodes.length} 集` : ''}</Text>
      </View>
      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}
      {loading && episodes.length === 0 ? (
        <View style={{ padding: PAD, gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.skeletonTile, { width: '100%', height: thumbH + 16, borderRadius: 10 }]} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listBody}>
          {episodes.map((ep) => {
            const resume = resumeAt[ep.channelId] ?? 0;
            return (
              <Pressable
                key={ep.channelId}
                style={({ pressed }) => [styles.epRow, pressed && styles.cardPressed]}
                onPress={() => onPlay(ep.channelId, resume)}
              >
                {ep.posterUrl ? (
                  <Image source={{ uri: ep.posterUrl }} style={{ width: thumbW, height: thumbH, borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  <View style={[styles.posterFallbackTile, { width: thumbW, height: thumbH, borderRadius: 8 }]}>
                    <Text style={styles.posterFallbackText}>{ep.subtitle ?? '▶'}</Text>
                  </View>
                )}
                <View style={styles.epMain}>
                  <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{ep.subtitle}{resume > 0 ? ' · 有断点' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.select({ web: 14, default: 40 }), paddingHorizontal: 16, paddingBottom: 10, gap: 12,
  },
  back: { color: '#5b89ff', fontSize: 15 },
  brand: { color: '#fff', fontSize: 18, fontWeight: '700', flexShrink: 1 },
  count: { color: '#8b93a1', fontSize: 13 },
  hint: { color: '#8b93a1', fontSize: 14, textAlign: 'center', marginTop: 32 },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  wall: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, paddingTop: 8 },
  card: {},
  posterFallbackTile: { borderRadius: 10, backgroundColor: '#1c222b', alignItems: 'center', justifyContent: 'center' },
  posterFallbackText: { color: '#8b93a1', fontSize: 26 },
  cardTitle: { color: '#e6e9ef', fontSize: 13, marginTop: 6 },
  cardSub: { color: '#8b93a1', fontSize: 12, marginTop: 1 },
  listBody: { padding: 12, gap: 8 },
  epRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10 },
  epMain: { flex: 1, gap: 2 },
  epTitle: { color: '#e6e9ef', fontSize: 14 },
  skeletonTile: { borderRadius: 10, backgroundColor: '#1c222b' },
  skeletonLine: { height: 11, borderRadius: 4, backgroundColor: '#1c222b', marginTop: 8 },
});
