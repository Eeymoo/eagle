/**
 * Library browse screens: poster wall for one library (电影/电视剧) and
 * the series detail (episode list). Data flows in via props; the owning
 * route performs the loads. RN syntax — shared by web and native.
 */
import React from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LibraryItem } from '@eagle/core';
import { LIBRARY_CARD_H } from './LibraryHomeScreen.js';

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

/** Poster wall with incremental paging (big libraries stay smooth). */
export function LibraryBrowseScreen({ title, loading, errorMessage, items, onPlay, onOpenSeries, onBack }: LibraryBrowseScreenProps) {
  const [shownCount, setShownCount] = React.useState(PAGE);
  const shown = items.slice(0, shownCount);
  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ 返回</Text></Pressable>
        <Text style={styles.brand} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{items.length > 0 ? `${items.length} 项` : ''}</Text>
      </View>
      {loading && <Text style={styles.hint}>加载中…</Text>}
      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}
      {!loading && !errorMessage && items.length === 0 && <Text style={styles.hint}>这个库是空的。</Text>}
      <FlatList
        data={shown}
        keyExtractor={(i) => i.channelId}
        numColumns={4}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        columnWrapperStyle={styles.column}
        onEndReachedThreshold={0.5}
        onEndReached={() => setShownCount((c) => Math.min(c + PAGE, items.length))}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onPlay(item.channelId, 0))}>
            {item.posterUrl ? (
              <Image source={{ uri: item.posterUrl }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterFallback]}>
                <Text style={styles.posterFallbackText}>{item.title.slice(0, 1)}</Text>
              </View>
            )}
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
          </Pressable>
        )}
      />
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
  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ 返回</Text></Pressable>
        <Text style={styles.brand} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{episodes.length > 0 ? `${episodes.length} 集` : ''}</Text>
      </View>
      {loading && <Text style={styles.hint}>加载中…</Text>}
      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}
      <ScrollView contentContainerStyle={styles.listBody}>
        {episodes.map((ep) => {
          const resume = resumeAt[ep.channelId] ?? 0;
          return (
            <Pressable key={ep.channelId} style={styles.epRow} onPress={() => onPlay(ep.channelId, resume)}>
              {ep.posterUrl ? (
                <Image source={{ uri: ep.posterUrl }} style={styles.epThumb} />
              ) : (
                <View style={[styles.epThumb, styles.posterFallback]}>
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
  column: { gap: 12, marginBottom: 16, paddingHorizontal: 4 },
  card: { width: 150 },
  poster: { width: 150, height: LIBRARY_CARD_H, borderRadius: 10, backgroundColor: '#1c222b' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  posterFallbackText: { color: '#8b93a1', fontSize: 26 },
  cardTitle: { color: '#e6e9ef', fontSize: 13, marginTop: 6 },
  cardSub: { color: '#8b93a1', fontSize: 12, marginTop: 1 },
  listBody: { padding: 12, gap: 8 },
  epRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10 },
  epThumb: { width: 107, height: 60, borderRadius: 8, backgroundColor: '#1c222b' },
  epMain: { flex: 1, gap: 2 },
  epTitle: { color: '#e6e9ef', fontSize: 14 },
});
