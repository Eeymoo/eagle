/**
 * Pure-headed player screen: renders the PlayerController state machine and
 * forwards react-native-video events back to the controller. The only
 * platform-specific visual element (Video) lives here by design.
 *
 * Controls are fully self-drawn (no native `controls`): top bar with back +
 * channel name, center play/pause, LIVE badge. No seek bar (live TV).
 * The bottom URL debug row was removed — health info lives in the list now.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import RawVideo from 'react-native-video';
import type { Channel } from '@eagle/core';
import type { PlayerController, PlayerControlsController } from '@eagle/headless-ui';
import { usePlayer, usePlayerControls } from '@eagle/headless-ui';
import { t } from './theme.js';

/** react-native-video v6's JSX return type disagrees with @types/react 19 — bridge it. */
const Video = RawVideo as unknown as React.ComponentType<{
  source: { uri: string };
  style?: object;
  resizeMode?: string;
  paused?: boolean;
  ignoreSilentSwitch?: string;
  onLoad?: () => void;
  onError?: (e: unknown) => void;
}>;

/**
 * Extract a human-readable message from react-native-video's nested error
 * payload (e.error.{errorString, errorException, errorCode, ...}). Never
 * returns "[object Object]".
 */
function describeVideoError(e: unknown): string {
  if (typeof e === 'string') return e;
  const err = (e as { error?: Record<string, unknown> })?.error ?? (e as Record<string, unknown>);
  if (!err || typeof err !== 'object') return '未知错误';
  const parts: string[] = [];
  const code = err.errorCode ?? err.code;
  if (typeof code === 'number' || (typeof code === 'string' && code)) parts.push(`错误码 ${code}`);
  const desc =
    err.errorException ?? err.errorString ?? err.localizedDescription ??
    err.error ?? err.localizedFailureReason;
  if (typeof desc === 'string' && desc) parts.push(desc);
  if (parts.length === 0) {
    try {
      parts.push(JSON.stringify(err).slice(0, 120));
    } catch {
      parts.push('未知错误');
    }
  }
  return parts.join('：');
}

export interface PlayerScreenProps {
  controller: PlayerController;
  controls: PlayerControlsController;
  channel: Channel;
  onBack: () => void;
}

export function PlayerScreen({ controller, controls, channel, onBack }: PlayerScreenProps) {
  const state = usePlayer(controller);
  const ui = usePlayerControls(controls);
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

  const playing = state.status === 'playing';

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Pressable style={styles.videoWrap} onPress={controls.toggle}>
        {state.status === 'resolving' && <ActivityIndicator size="large" color={t.colors.accent} />}
        {state.status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>播放失败{state.errorMessage ? `\n${state.errorMessage}` : ''}</Text>
            <Text style={styles.errorHint}>直播源地址可能失效或网络不可达，可尝试重试或换一个频道。</Text>
            <Pressable style={styles.retry} onPress={() => void controller.open(channel)}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </View>
        )}
        {state.stream && state.status !== 'error' && (
          <Video
            source={{ uri: state.stream.url }}
            style={styles.video}
            resizeMode="contain"
            paused={ui.paused}
            ignoreSilentSwitch="ignore"
            onLoad={() => controller.onMediaPlaying()}
            onError={(e) => controller.onMediaError(describeVideoError(e))}
          />
        )}
      </Pressable>

      {ui.visible && state.status !== 'error' && (
        <>
          <View style={[styles.bar, { paddingTop: insets.top + 6, paddingLeft: insets.left + t.spacing.md, paddingRight: insets.right + t.spacing.md }]}>
            <Pressable onPress={onBack} style={styles.back} hitSlop={12}>
              <Text style={styles.backText}>‹ 返回</Text>
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {channel.name}
            </Text>
            {playing && (
              <View style={styles.live}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          <Pressable
            style={styles.centerBtn}
            onPress={() => controls.togglePlayPause()}
            hitSlop={16}
          >
            <Text style={styles.centerIcon}>{ui.paused ? '▶' : '❚❚'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  videoWrap: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    gap: t.spacing.md,
    backgroundColor: 'rgba(14,17,22,0.66)',
  },
  back: { padding: 4 },
  backText: { color: t.colors.accent, fontSize: t.typography.fontSizeMd },
  title: {
    color: t.colors.textPrimary,
    flex: 1,
    fontSize: t.typography.fontSizeMd,
    fontWeight: t.typography.fontWeightSemibold,
  },
  live: {
    backgroundColor: t.colors.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  centerBtn: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(14,17,22,0.55)',
    top: '50%',
    marginTop: -32,
    zIndex: 10,
  },
  centerIcon: { color: '#fff', fontSize: 22, textAlign: 'center' },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: t.spacing.xl },
  error: { color: t.colors.danger, textAlign: 'center', fontSize: t.typography.fontSizeMd },
  errorHint: {
    color: t.colors.textSecondary,
    textAlign: 'center',
    marginTop: t.spacing.sm,
    fontSize: t.typography.fontSizeXs,
  },
  retry: { alignSelf: 'center', marginTop: t.spacing.md, padding: t.spacing.sm },
  retryText: { color: t.colors.accent },
});
