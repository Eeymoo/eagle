/**
 * Pure-headed player screen: renders the PlayerController state machine and
 * forwards react-native-video events back to the controller. The only
 * platform-specific visual element (Video) lives here by design.
 *
 * Entering this screen locks landscape; leaving restores portrait/default.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import RawVideo from 'react-native-video';
import type { Channel } from '@eagle/core';
import type { PlayerController } from '@eagle/headless-ui';
import { usePlayer } from '@eagle/headless-ui';
import { t } from './theme.js';

/** react-native-video v6's JSX return type disagrees with @types/react 19 — bridge it. */
const Video = RawVideo as unknown as React.ComponentType<{
  source: { uri: string };
  style?: object;
  resizeMode?: string;
  controls?: boolean;
  ignoreSilentSwitch?: string;
  onLoad?: () => void;
  onError?: (e: unknown) => void;
}>;

export interface PlayerScreenProps {
  controller: PlayerController;
  channel: Channel;
  onBack: () => void;
}

export function PlayerScreen({ controller, channel, onBack }: PlayerScreenProps) {
  const state = usePlayer(controller);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void controller.open(channel);
  }, [controller, channel]);

  // Landscape while playing; restore on unmount.
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {channel.name}
        </Text>
        <Text style={styles.status}>{state.status}</Text>
      </View>

      <View style={styles.videoWrap}>
        {state.status === 'resolving' && <ActivityIndicator size="large" color={t.colors.accent} />}
        {state.status === 'error' && (
          <>
            <Text style={styles.error}>播放失败：{state.errorMessage}</Text>
            <Pressable style={styles.retry} onPress={() => void controller.open(channel)}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </>
        )}
        {state.stream && state.status !== 'error' && (
          <Video
            source={{ uri: state.stream.url }}
            style={styles.video}
            resizeMode="contain"
            controls
            ignoreSilentSwitch="ignore"
            onLoad={() => controller.onMediaPlaying()}
            onError={(e) => controller.onMediaError(String(e))}
          />
        )}
      </View>

      {state.stream && (
        <Text style={[styles.meta, { paddingBottom: insets.bottom + 2 }]}>
          {state.stream.kind} · {state.stream.url.slice(0, 96)}
          {state.stream.url.length > 96 ? '…' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.bgCanvas },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: t.spacing.md,
    gap: t.spacing.md,
    backgroundColor: 'rgba(14,17,22,0.72)',
  },
  back: { padding: 4 },
  backText: { color: t.colors.accent, fontSize: t.typography.fontSizeMd },
  title: {
    color: t.colors.textPrimary,
    flex: 1,
    fontSize: t.typography.fontSizeMd,
    fontWeight: t.typography.fontWeightSemibold,
  },
  status: { color: t.colors.textSecondary, fontSize: t.typography.fontSizeXs },
  videoWrap: { flex: 1, backgroundColor: t.colors.bgOverlay },
  video: { flex: 1 },
  error: { color: t.colors.danger, textAlign: 'center', marginTop: t.spacing.xl },
  retry: { alignSelf: 'center', marginTop: t.spacing.md, padding: t.spacing.sm },
  retryText: { color: t.colors.accent },
  meta: {
    color: t.colors.textSecondary,
    fontSize: t.typography.fontSizeXs,
    paddingLeft: t.spacing.sm,
    backgroundColor: 'rgba(14,17,22,0.72)',
  },
});
