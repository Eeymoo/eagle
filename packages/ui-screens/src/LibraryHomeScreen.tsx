/**
 * Jellyfin-style modular media-library home: 继续观看 / 我的媒体 / 最近添加.
 * Pure-headed — data + callbacks come in as props; styling from tokens +
 * inline platform styles. Web & native share this RN-syntax component.
 */
import React, { useEffect } from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MediaLibrary, LibraryItem } from '@eagle/core';
import type { WatchProgressEntry } from '@eagle/headless-ui';
import { t } from './theme.js';

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

/** Jellyfin CollectionType → emoji + label shown on the library card. */
function libraryIcon(kind: string): string {
  switch (kind) {
    case 'movies': return '🎬';
    case 'tvshows': return '📺';
    case 'music': return '🎵';
    case 'boxsets': return '📦';
    default: return '📁';
  }
}

export function LibraryHomeScreen(props: LibraryHomeScreenProps) {
  const { available, status, errorMessage, libraries, recent, continueWatching, onPlay, onRemoveProgress, onOpenLibrary, onOpenSeries, onBack } = props;

  useEffect(() => {
    // No auto-load here — the owning route triggers library.refresh() so the
    // controller stays the single source of truth.
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.brand}>Eagle 媒体库</Text>
        <Text style={styles.backPlaceholder}> </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {status === 'error' && <Text style={styles.hint}>媒体库加载失败：{errorMessage ?? ''}</Text>}
        {available === false && status === 'ready' && (
          <Text style={styles.hint}>还没有点播媒体库。请到设置添加 Jellyfin 媒体库源。</Text>
        )}
        {status === 'loading' && <Text style={styles.hint}>媒体库加载中…</Text>}

        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>▶ 继续观看</Text>
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
                  <Pressable style={styles.progressCard} onPress={() => onPlay(item.channelId, item.positionSec)}>
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={styles.progressPoster} />
                    ) : (
                      <View style={[styles.progressPoster, styles.posterFallback]}>
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

        {libraries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>▶ 我的媒体</Text>
            <FlatList
              horizontal
              data={libraries}
              keyExtractor={(l) => l.id}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={6}
              renderItem={({ item }) => (
                <Pressable style={styles.libraryCard} onPress={() => onOpenLibrary(item)}>
                  <Text style={styles.libraryIcon}>{libraryIcon(item.kind)}</Text>
                  <Text style={styles.libraryName} numberOfLines={1}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>▶ 最近添加</Text>
            <FlatList
              horizontal
              data={recent}
              keyExtractor={(r) => r.channelId}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.posterCard}
                  onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onPlay(item.channelId, 0))}
                >
                  {item.posterUrl ? (
                    <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                  ) : (
                    <View style={[styles.poster, styles.posterFallback]}>
                      <Text style={styles.posterFallbackText}>{item.title.slice(0, 1)}</Text>
                    </View>
                  )}
                  {item.kind === 'episode' && item.seriesId && <View style={styles.badge}><Text style={styles.badgeText}>剧集</Text></View>}
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
                </Pressable>
              )}
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

export const LIBRARY_CARD_W = 150;
export const LIBRARY_CARD_H = 210;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.select({ web: 14, default: 40 }), paddingHorizontal: 16, paddingBottom: 10,
  },
  back: { color: '#5b89ff', fontSize: 15 },
  backPlaceholder: { width: 48 },
  brand: { color: '#fff', fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  progressCard: { width: LIBRARY_CARD_W, marginRight: 12 },
  progressPoster: { width: LIBRARY_CARD_W, height: LIBRARY_CARD_H, borderRadius: 10, backgroundColor: '#1c222b' },
  progressBarWrap: { height: 3, backgroundColor: '#2a313c', borderRadius: 2, marginTop: 6 },
  progressBar: { height: 3, backgroundColor: '#5b89ff', borderRadius: 2 },
  posterCard: { width: LIBRARY_CARD_W, marginRight: 12 },
  poster: { width: LIBRARY_CARD_W, height: LIBRARY_CARD_H, borderRadius: 10, backgroundColor: '#1c222b' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  posterFallbackText: { color: '#8b93a1', fontSize: 28 },
  libraryCard: {
    width: 150, height: 110, borderRadius: 12, backgroundColor: '#1a2029',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, gap: 6, borderWidth: 1, borderColor: '#262d38',
  },
  libraryIcon: { fontSize: 30 },
  libraryName: { color: '#fff', fontSize: 14, fontWeight: '600', maxWidth: 130 },
  cardTitle: { color: '#e6e9ef', fontSize: 13, marginTop: 6 },
  cardSub: { color: '#8b93a1', fontSize: 12, marginTop: 1 },
  progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeX: { color: '#8b93a1', fontSize: 16, paddingLeft: 8 },
  badge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(91,137,255,0.9)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11 },
  hint: { color: '#8b93a1', fontSize: 14, textAlign: 'center', marginTop: 32 },
});
