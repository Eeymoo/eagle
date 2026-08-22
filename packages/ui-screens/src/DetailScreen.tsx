/**
 * Infuse-style item detail screen: landscape backdrop hero, title +
 * metadata row (year · runtime · rating · genres), a prominent
 * Play / 续播 (resume) action, and the synopsis. Reachable from the
 * browse wall — clicking a poster opens details instead of playing
 * (Infuse interaction logic).
 *
 * Layout discipline: hero and body share ONE aligned content column
 * (maxWidth 1280, centered on desktop) — no magic offsets. When the
 * server has no backdrop art, fall back to a poster-card composition
 * (portrait poster left, title block right) instead of stretching a
 * 2:3 poster across a wide hero (which crops badly).
 */
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Play, RotateCcw } from '@eagle/icons';
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

  const meta: string[] = [];
  if (item.year) meta.push(String(item.year));
  if (item.runtimeMin) meta.push(`${item.runtimeMin} 分钟`);
  if (item.rating) meta.push(`★ ${item.rating.toFixed(1)}`);
  if (item.genres?.length) meta.push(item.genres.slice(0, 3).join(' / '));

  const actions = (
    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
        onPress={() => onPlay(resumeAt)}
        accessibilityRole="button"
      >
        <Play size={15} color="#ffffff" strokeWidth={2} />
        <Text style={styles.playLabel}>{resumeAt > 0 ? '继续播放' : '播放'}</Text>
      </Pressable>
      {resumeAt > 0 && (
        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
          onPress={() => onPlay(0)}
          accessibilityRole="button"
        >
          <RotateCcw size={13} color="#e6e9ef" strokeWidth={1.8} />
          <Text style={styles.ghostLabel}>从头播放</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ONE aligned content column for hero + body. */}
        <View style={{ width: '100%', maxWidth: contentW, alignSelf: 'center' }}>
          {item.backdropUrl ? (
            /* Backdrop hero: landscape art, gradient scrim bottom, title
             * block + actions overlaid (Infuse composition). */
            <View style={[styles.hero, { height: desktop ? 340 : 210 }]}>
              <Image source={{ uri: item.backdropUrl }} style={StyleSheet.absoluteFill as object} resizeMode="cover" />
              <View style={styles.heroScrim} />
              <View style={styles.heroBody}>
                <Text style={[styles.title, desktop && styles.titleDesktop]} numberOfLines={2}>{item.title}</Text>
                {meta.length > 0 && <Text style={styles.meta} numberOfLines={1}>{meta.join('   ·   ')}</Text>}
                {actions}
              </View>
            </View>
          ) : (
            /* Fallback: poster-card composition. Portrait poster sits LEFT
             * of the title block — never stretched across a wide band. */
            <View style={[styles.card, desktop && styles.cardDesktop]}>
              <View style={desktop ? styles.cardRow : styles.cardCol}>
                {item.posterUrl ? (
                  <Image
                    source={{ uri: item.posterUrl }}
                    style={{ width: desktop ? 180 : 130, height: desktop ? 253 : 183, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.cardBody}>
                  <Text style={[styles.title, desktop && styles.titleDesktop]} numberOfLines={3}>{item.title}</Text>
                  {meta.length > 0 && <Text style={styles.meta} numberOfLines={2}>{meta.join('   ·   ')}</Text>}
                  {actions}
                </View>
              </View>
            </View>
          )}

          {/* Synopsis */}
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>简介</Text>
            <Text style={styles.overview}>{item.overview || '暂无简介'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  scroll: { paddingTop: Platform.select({ web: 16, default: 44 }), paddingBottom: 48 },
  hero: { position: 'relative', justifyContent: 'flex-end', borderRadius: 16, overflow: 'hidden', backgroundColor: '#141922' },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,13,18,0.30)',
    borderBottomColor: 'rgba(10,13,18,0.85)',
    borderBottomWidth: 160,
  },
  back: { color: '#fff', fontSize: 15, backgroundColor: 'rgba(10,13,18,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
  heroBody: { padding: 20, paddingTop: 26, gap: 8 },
  card: { backgroundColor: '#141922', borderRadius: 16, padding: 16, gap: 14 },
  cardDesktop: { padding: 20 },
  cardRow: { flexDirection: 'row', gap: 20 },
  cardCol: { flexDirection: 'column', gap: 14, alignItems: 'center' },
  cardBody: { flex: 1, gap: 8, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  titleDesktop: { fontSize: 30 },
  meta: { color: '#aeb6c2', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#5b89ff',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  playLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(10,13,18,0.40)',
  },
  ghostLabel: { color: '#e6e9ef', fontSize: 14 },
  body: { padding: 20, gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  overview: { color: '#aeb6c2', fontSize: 14, lineHeight: 22 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
