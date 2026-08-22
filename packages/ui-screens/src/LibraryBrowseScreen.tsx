/**
 * Library browse screens: poster wall for one library (电影/电视剧) and
 * the series detail (episode list), Jellyfin web-style.
 *
 * Series detail mirrors Jellyfin: a backdrop hero (series artwork as a wide
 * letterboxed banner), title block, then episode rows that span the FULL
 * content width — thumbnail left, title + resume indicator right.
 * Responsive: 1280 cap on desktop, full-bleed on mobile; skeletons mirror
 * each layout.
 */
import React from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { LibraryItem } from '@eagle/core';

export interface LibraryBrowseScreenProps {
  title: string;
  loading: boolean;
  errorMessage?: string;
  items: LibraryItem[];
  onPlay: (channelId: string, resumeAtSec: number) => void;
  onOpenSeries: (item: LibraryItem) => void;
  /** Infuse logic: movies open a DETAIL page (not direct play). */
  onOpenDetail: (item: LibraryItem) => void;
  onBack: () => void;
}

const PAGE = 40;
const GAP = 12;
const PAD = 16;

/** Sort keys for the Infuse-style browse toolbar. */
type SortKey = 'added' | 'title' | 'year';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'added', label: '添加时间' },
  { key: 'title', label: '名称' },
  { key: 'year', label: '年份' },
];

/** Poster wall with incremental paging + Infuse browse controls:
 *  sort bar, ascending/descending toggle, poster/list view, search. */
export function LibraryBrowseScreen({ title, loading, errorMessage, items, onPlay, onOpenSeries, onOpenDetail, onBack }: LibraryBrowseScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const cardW = desktop ? 158 : 124;
  const cardH = Math.round(cardW * 1.405); // 2:3 poster ratio (Jellyfin standard)
  const cols = Math.max(2, Math.min(desktop ? 7 : 3, Math.floor((width - 2 * PAD) / (cardW + GAP))));
  const [shownCount, setShownCount] = React.useState(PAGE);
  React.useEffect(() => setShownCount(PAGE), [cols]);
  // Infuse browse state: sort + direction + view mode + query.
  const [sortKey, setSortKey] = React.useState<SortKey>('added');
  const [desc, setDesc] = React.useState(true);
  const [listView, setListView] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
    const dir = desc ? -1 : 1;
    const sorted = [...base].sort((a, b) => {
      if (sortKey === 'title') return dir * a.title.localeCompare(b.title, 'zh');
      if (sortKey === 'year') return dir * ((a.year ?? 0) - (b.year ?? 0));
      return dir * ((a.addedAt ?? '').localeCompare(b.addedAt ?? ''));
    });
    return sorted;
  }, [items, query, sortKey, desc]);
  const shown = filtered.slice(0, shownCount);

  return (
    <View style={[styles.root, desktop && styles.wideRoot]}>
      <View style={[styles.appBar, desktop && styles.wideInner]}>
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && styles.cardPressed}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.brand} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{filtered.length > 0 ? `${filtered.length} 项` : ''}</Text>
      </View>

      {/* Infuse browse toolbar: search, sort chips, direction, view */}
      <View style={[styles.toolbar, desktop && styles.wideInner]}>
        <TextInput
          style={styles.search}
          placeholder="搜索…"
          placeholderTextColor="#5b6472"
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.sortRow}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => { setSortKey(s.key); setShownCount(PAGE); }}
              style={({ pressed }) => [styles.sortChip, sortKey === s.key && styles.sortChipActive, pressed && styles.cardPressed]}
            >
              <Text style={[styles.sortChipText, sortKey === s.key && styles.sortChipTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setDesc((d) => !d)} style={({ pressed }) => [styles.sortChip, pressed && styles.cardPressed]} accessibilityLabel="切换排序方向">
            <Text style={styles.sortChipText}>{desc ? '↓' : '↑'}</Text>
          </Pressable>
          <Pressable onPress={() => setListView((v) => !v)} style={({ pressed }) => [styles.sortChip, pressed && styles.cardPressed]} accessibilityLabel="切换视图">
            <Text style={styles.sortChipText}>{listView ? '▦ 海报' : '☰ 列表'}</Text>
          </Pressable>
        </View>
      </View>


      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}
      {!errorMessage && !loading && filtered.length === 0 && <Text style={styles.hint}>{query ? '没有匹配的条目。' : '这个库是空的。'}</Text>}

      {loading && items.length === 0 ? (
        <View style={[styles.wall, { gap: GAP }]}>
          {Array.from({ length: cols * 4 }).map((_, i) => (
            <View key={i} style={{ width: cardW }}>
              <View style={[styles.skeletonTile, { width: cardW, height: cardH }]} />
              <View style={[styles.skeletonLine, { width: cardW * 0.8 }]} />
            </View>
          ))}
        </View>
      ) : listView ? (
        /* Infuse list view: compact rows — small thumb, title, meta. */
        <FlatList
          data={shown}
          keyExtractor={(i) => i.channelId}
          key="list"
          style={desktop ? styles.wideInner : undefined}
          contentContainerStyle={{ paddingHorizontal: PAD }}
          onEndReachedThreshold={0.5}
          onEndReached={() => setShownCount((c) => Math.min(c + PAGE, filtered.length))}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.listRow, pressed && styles.cardPressed]}
              onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onOpenDetail(item))}
            >
              <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.listMeta} numberOfLines={1}>
                {item.subtitle ?? ''}{item.year ? `${item.subtitle ? '   ·   ' : ''}${item.year}` : ''}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.channelId}
          key={cols}
          numColumns={cols}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          // Center rows so an incomplete LAST row (few items, filtered
          // tails) stays visually balanced on wide desktops.
          columnWrapperStyle={{ gap: GAP, marginBottom: 18, justifyContent: 'center' }}
          style={desktop ? styles.wideInner : undefined}
          contentContainerStyle={{ paddingHorizontal: PAD }}
          onEndReachedThreshold={0.5}
                  onEndReached={() => setShownCount((c) => Math.min(c + PAGE, filtered.length))}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { width: cardW }, pressed && styles.cardPressed]}
              onPress={() => (item.kind === 'series' ? onOpenSeries(item) : onOpenDetail(item))}
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

/** One episode still: fixed height, width follows the image's natural aspect. */
function EpisodeStill({ uri, height, radius = 8, fallbackText }: { uri?: string; height: number; radius?: number; fallbackText?: string }): React.JSX.Element {
  const [ratio, setRatio] = React.useState<number | null>(null);
  const style = { height, ...(ratio ? { width: Math.round(height * ratio) } : { aspectRatio: 16 / 9 }), borderRadius: radius } as const;
  if (!uri) {
    return (
      <View style={[styles.posterFallbackTile, style]}>
        <Text style={styles.posterFallbackText}>{fallbackText ?? '▶'}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onLoad={(e) => {
        const src = (e as unknown as { source?: { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } }).source ?? {};
        const w = src.naturalWidth ?? src.width;
        const h = src.naturalHeight ?? src.height;
        if (w && h) setRatio(w / h);
      }}
    />
  );
}

/** Series detail, Jellyfin web-style: hero backdrop + full-width episode rows. */
export function SeriesScreen({ title, loading, errorMessage, episodes, resumeAt, onPlay, onBack }: SeriesScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  // Full content width (same cap as every other library page) — episode
  // rows align with the top bar's width, not a narrow column.
  const contentW = Math.min(width, 1280);
  // Desktop nav rail (@eagle/ui-nav NAV_WIDTH): the hero is FULL-BLEED —
  // artwork runs under the floating rail, only text keeps the inset.
  const railInset = desktop ? 92 : 0;
  const heroH = desktop ? 300 : 170;
  // Episode stills: fixed HEIGHT, width follows each image's natural
  // aspect ratio (Jellyfin primaries aren't always 16:9 — some are wider).
  const thumbH = desktop ? 124 : 86;
  const heroBackdrop = episodes.find((e) => e.posterUrl)?.posterUrl;

  // Infuse seasons: derive from SxxEyy subtitles; pill selector filters.
  const seasons = React.useMemo(() => {
    const set = new Set<number>();
    for (const e of episodes) {
      const m = /S(\d+)E\d+/.exec(e.subtitle ?? '');
      if (m) set.add(Number(m[1]));
    }
    return [...set].sort((a, b) => a - b);
  }, [episodes]);
  const [season, setSeason] = React.useState<number | null>(null);
  const activeSeason = season ?? seasons[0] ?? null;
  const visibleEps = React.useMemo(
    () => (activeSeason == null ? episodes : episodes.filter((e) => /S(\d+)E\d+/.exec(e.subtitle ?? '')?.[1] === String(activeSeason))),
    [episodes, activeSeason],
  );

  return (
    <View style={styles.root}>
      {/* Hero: series artwork as a backdrop with scrim + title, capped to the
          same content width as the episode rows below (cover-width page). */}
      <View style={[styles.hero, desktop && { marginLeft: -railInset, maxWidth: contentW + railInset }]}>
        {heroBackdrop ? (
          <Image source={{ uri: heroBackdrop }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={styles.heroFallback} />
        )}
        <View style={styles.heroScrim} />
        <View style={[styles.heroBar, { width: contentW, ...(desktop ? { marginLeft: railInset } : null) }]}>
          <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && styles.cardPressed}>
            <Text style={styles.back}>‹ 返回</Text>
          </Pressable>
        </View>
        <View style={[styles.heroTitleWrap, { width: contentW, ...(desktop ? { marginLeft: railInset } : null) }]}>
          <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>
          {episodes.length > 0 && <Text style={styles.heroSub}>{episodes.length} 集</Text>}
        </View>
      </View>

      {/* Season pills (Infuse series detail) */}
      {seasons.length > 1 && (
        <View style={[styles.seasonRow, { maxWidth: contentW, width: '100%' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {seasons.map((sn) => (
              <Pressable
                key={sn}
                onPress={() => setSeason(sn)}
                style={({ pressed }) => [styles.sortChip, sn === activeSeason && styles.sortChipActive, pressed && styles.cardPressed]}
              >
                <Text style={[styles.sortChipText, sn === activeSeason && styles.sortChipTextActive]}>第 {sn} 季</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {errorMessage ? <Text style={styles.hint}>加载失败：{errorMessage}</Text> : null}

      {loading && episodes.length === 0 ? (
        <View style={[styles.epList, { maxWidth: contentW, width: '100%', alignSelf: 'center' }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 16 }}>
              <View style={[styles.skeletonTile, { height: thumbH, aspectRatio: 16 / 9 }]} />
              <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
                <View style={[styles.skeletonLine, { width: '50%', marginTop: 0 }]} />
                <View style={[styles.skeletonLine, { width: '90%' }]} />
                <View style={[styles.skeletonLine, { width: '70%' }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView>
        <View style={[styles.epList, { maxWidth: contentW, width: '100%' }]}>
          {visibleEps.map((ep) => {
            const resume = resumeAt[ep.channelId] ?? 0;
            return (
              <Pressable
                key={ep.channelId}
                style={({ pressed }) => [styles.epRow, pressed && styles.cardPressed]}
                onPress={() => onPlay(ep.channelId, resume)}
              >
                <View>
                  <EpisodeStill uri={ep.posterUrl} height={thumbH} fallbackText={ep.subtitle ?? '▶'} />
                  {resume > 0 && (
                    <View style={styles.epProgressWrap}>
                      <View style={[styles.epProgressBar, { width: '40%' }]} />
                    </View>
                  )}
                </View>
                <View style={styles.epMain}>
                  <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{ep.subtitle}{resume > 0 ? ' · 有断点' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1116' },
  // Infuse browse toolbar
  toolbar: { paddingHorizontal: PAD, paddingTop: 4, paddingBottom: 10, gap: 8 },
  search: {
    color: '#fff', backgroundColor: '#141922', borderWidth: 1, borderColor: '#1d232d',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.select({ web: 7, default: 9 }),
    fontSize: 14, maxWidth: 360,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    backgroundColor: '#141922', borderWidth: 1, borderColor: '#1d232d',
  },
  sortChipActive: { backgroundColor: 'rgba(91,137,255,0.20)', borderColor: '#5b89ff' },
  sortChipText: { color: '#aeb6c2', fontSize: 12 },
  sortChipTextActive: { color: '#fff' },
  // List view rows
  listRow: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, gap: 3,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1d232d',
  },
  listTitle: { color: '#e6e9ef', fontSize: 15 },
  listMeta: { color: '#8b93a1', fontSize: 12 },
  // Desktop: cap content at 1280 centered (matches the library home).
  wideRoot: { alignItems: 'center' },
  wideInner: { width: '100%', maxWidth: 1280 },
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
  // Series hero
  hero: { position: 'relative', justifyContent: 'flex-end', alignItems: 'center' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#161b23' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,13,18,0.55)' },
  heroBar: { position: 'absolute', top: Platform.select({ web: 14, default: 40 }), left: 0, paddingHorizontal: 16 },
  heroTitleWrap: { paddingHorizontal: 20, paddingBottom: 14 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  heroSub: { color: '#aeb6c2', fontSize: 13, marginTop: 4 },
  // Episode list: full content-width rows (Jellyfin detail layout)
  seasonRow: { marginTop: 14 },
  epList: { padding: 16, gap: 18 },
  epRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  // Text block follows the cover's width (flex-bounded, not full-stretch).
  epMain: { flex: 1, gap: 4, paddingTop: 6 },
  epTitle: { color: '#e6e9ef', fontSize: 15 },
  epProgressWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(42,49,60,0.9)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  epProgressBar: { height: 4, backgroundColor: '#5b89ff', borderBottomLeftRadius: 8 },
  skeletonTile: { borderRadius: 10, backgroundColor: '#1c222b' },
  skeletonLine: { height: 11, borderRadius: 4, backgroundColor: '#1c222b', marginTop: 8 },
});
