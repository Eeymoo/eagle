/**
 * Infuse-style item detail screen: full-bleed backdrop hero, title +
 * metadata row (year · runtime · rating · genres), a prominent
 * Play / 续播 (resume) action, and the synopsis. Reachable from the
 * browse wall — clicking a poster opens details instead of playing
 * (Infuse interaction logic).
 */
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Play, RotateCcw } from 'lucide-react';
import type { LibraryItem } from '@eagle/core';

export interface DetailScreenProps {
  item: LibraryItem;
  /** Watch position in seconds, 0 when none. */
  resumeAt: number;
  onPlay: (startAtSec: number) => void;
  onBack: () => void;
}

export function DetailScreen({ item, resumeAt, onPlay, onBack }: DetailScreenProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const contentW = Math.min(width, 1280);
  const heroH = desktop ? 320 : 190;

  const meta: string[] = [];
  if (item.year) meta.push(String(item.year));
  if (item.runtimeMin) meta.push(`${item.runtimeMin} 分钟`);
  if (item.rating) meta.push(`★ ${item.rating.toFixed(1)}`);
  if (item.genres?.length) meta.push(item.genres.slice(0, 3).join(' / '));

  return (
    <View style={styles.root}>
      {/* Hero: full-bleed artwork with scrim; title + meta + actions. */}
      <View style={[styles.hero, { height: heroH, maxWidth: contentW + 92, width: '100%' }]}>
        {item.posterUrl ? (
          <Image
            source={{ uri: item.posterUrl }}
            style={StyleSheet.absoluteFill as object}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroFallback} />
        )}
        <View style={styles.heroScrim} />
        <Pressable hitSlop={8} onPress={onBack} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <View style={styles.heroBody}>
          <Text style={[styles.title, desktop && styles.titleDesktop]} numberOfLines={2}>{item.title}</Text>
          {meta.length > 0 && (
            <Text style={styles.meta} numberOfLines={1}>{meta.join('   ·   ')}</Text>
          )}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
              onPress={() => onPlay(resumeAt)}
              accessibilityRole="button"
            >
              <Play size={16} color="#fff" />
              <Text style={styles.playLabel}>{resumeAt > 0 ? '继续播放' : '播放'}</Text>
            </Pressable>
            {resumeAt > 0 && (
              <Pressable
                style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                onPress={() => onPlay(0)}
                accessibilityRole="button"
              >
                <RotateCcw size={14} color="#e6e9ef" />
                <Text style={styles.ghostLabel}>从头播放</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Synopsis */}
      {item.overview ? (
        <ScrollView>
          <View style={[styles.body, { maxWidth: contentW, width: '100%' }]}>
            <Text style={styles.sectionTitle}>简介</Text>
            <Text style={styles.overview}>{item.overview}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.body, { maxWidth: contentW, width: '100%' }]}>
          <Text style={styles.overviewDim}>暂无简介</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  hero: { position: 'relative', justifyContent: 'flex-end', backgroundColor: '#141922' },
  heroFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a2029' },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,13,18,0.62)',
  },
  back: { position: 'absolute', top: Platform.select({ web: 14, default: 40 }), left: 16, color: '#fff', fontSize: 15 },
  heroBody: { padding: 20, paddingTop: 26, gap: 8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  titleDesktop: { fontSize: 30 },
  meta: { color: '#aeb6c2', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#5b89ff',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  playLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  ghostLabel: { color: '#e6e9ef', fontSize: 14 },
  body: { alignSelf: 'center', padding: 20, gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  overview: { color: '#aeb6c2', fontSize: 14, lineHeight: 22 },
  overviewDim: { color: '#5b6472', fontSize: 14 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
