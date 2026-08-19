/**
 * Pure-headed channel list: renders state from the headless controller,
 * styles from design tokens. No data fetching, no filtering logic here —
 * those live in @eagle/headless-ui.
 */
import React, { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Channel } from '@eagle/core';
import type { ChannelListController } from '@eagle/headless-ui';
import { useChannelList } from '@eagle/headless-ui';
import { t } from './theme.js';

export interface ChannelListScreenProps {
  controller: ChannelListController;
  onPlay: (channel: Channel) => void;
  onOpenSettings: () => void;
}

export function ChannelListScreen({ controller, onPlay, onOpenSettings }: ChannelListScreenProps) {
  const state = useChannelList(controller);

  useEffect(() => {
    void controller.refresh();
  }, [controller]);

  const visible = controller.visibleChannels();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="搜索频道"
          placeholderTextColor={t.colors.textDisabled}
          value={state.query}
          onChangeText={(q) => controller.setQuery(q)}
        />
        <Pressable onPress={onOpenSettings} style={styles.gear}>
          <Text style={styles.gearText}>⚙︎</Text>
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
      {state.status === 'ready' && visible.length === 0 && (
        <Text style={styles.hint}>没有频道。请到设置添加 Jellyfin / M3U Tuner / HDHomeRun 源。</Text>
      )}

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.bgCanvas },
  header: { flexDirection: 'row', alignItems: 'center', padding: t.spacing.md, gap: t.spacing.sm },
  search: {
    flex: 1,
    backgroundColor: t.colors.bgSurface,
    color: t.colors.textPrimary,
    borderRadius: t.radii.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm + 2,
  },
  gear: { padding: t.spacing.sm },
  gearText: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeLg },
  hint: { color: t.colors.textSecondary, textAlign: 'center', marginTop: t.spacing.xl },
  error: { color: t.colors.danger, textAlign: 'center', marginTop: t.spacing.xl },
  retry: { color: t.colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', padding: t.spacing.md, gap: t.spacing.md },
  logo: { width: 44, height: 44, borderRadius: t.radii.md, backgroundColor: t.colors.bgSurface },
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
