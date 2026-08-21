/**
 * Pure-headed player screen: renders the PlayerController state machine and
 * forwards react-native-video events back to the controller. The only
 * platform-specific visual element (Video) lives here by design.
 *
 * Controls are fully self-drawn (no native `controls`): top bar with back +
 * channel name, center play/pause, LIVE badge. No seek bar (live TV).
 * The bottom URL debug row was removed — health info lives in the list now.
 */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import RawVideo from 'react-native-video';
import type { Channel } from '@eagle/core';
import type { PlayerController, PlayerControlsController } from '@eagle/headless-ui';
import { usePlayer, usePlayerControls } from '@eagle/headless-ui';
import { t } from './theme.js';

/** react-native-video v6's JSX return type disagrees with @types/react 19 — bridge it. */
type VideoHandle = { seek: (seconds: number) => void };
const Video = RawVideo as unknown as React.ComponentType<{
  source: { uri: string };
  style?: object;
  resizeMode?: string;
  paused?: boolean;
  controls?: boolean;
  ignoreSilentSwitch?: string;
  onLoad?: () => void;
  /** VOD progress: { currentPosition, seekableDuration } in seconds. */
  onProgress?: (data: { currentPosition: number; seekableDuration: number }) => void;
  onError?: (e: unknown) => void;
  ref?: React.Ref<VideoHandle>;
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
  const isVod = channel.isVod === true;
  const videoRef = useRef<VideoHandle | null>(null);
  const trackWidth = useRef(0);
  const [progress, setProgress] = React.useState({ t: 0, dur: 0 });
  const fmt = (s: number): string => {
    if (!Number.isFinite(s)) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Pressable style={styles.videoWrap} onPress={controls.toggle}>
        {state.status === 'resolving' && <ActivityIndicator size="large" color={t.colors.accent} />}
        {state.status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>播放失败{state.errorMessage ? `\n${state.errorMessage}` : ''}</Text>
            <Text style={styles.errorHint}>{isVod
              ? '媒体文件可能无法直接播放（编码不兼容）或网络不可达，可尝试重试。'
              : '直播源地址可能失效或网络不可达，可尝试重试或换一个频道。'}</Text>
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
            controls={false}
            ignoreSilentSwitch="ignore"
            onLoad={() => controller.onMediaPlaying()}
            onProgress={(d) => setProgress({ t: d.currentPosition, dur: d.seekableDuration || 0 })}
            ref={(v: VideoHandle | null) => { videoRef.current = v; }}
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
            {playing && !isVod && (
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

          {isVod && progress.dur > 0 && (
            <View
              style={[styles.vodBar, { bottom: insets.bottom + t.spacing.md }]}
              onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
              onTouchEnd={(e) => {
                // Tap-to-seek: fractional X across the bar → seconds.
                const w = trackWidth.current;
                if (w > 0) {
                  const ratio = Math.min(Math.max(e.nativeEvent.locationX / w, 0), 1);
                  videoRef.current?.seek(ratio * progress.dur);
                }
              }}
            >
              <Text style={styles.vodTime}>{fmt(progress.t)}</Text>
              <View style={styles.vodTrack}>
                <View style={{ flex: Math.max(progress.t, 0.001) }}>
                  <View style={styles.vodFill} />
                </View>
                <View style={{ flex: Math.max(progress.dur - progress.t, 0.001) }} />
              </View>
              <Text style={styles.vodTime}>{fmt(progress.dur)}</Text>
            </View>
          )}
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
  vodBar: {
    position: 'absolute',
    left: t.spacing.md,
    right: t.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    zIndex: 10,
  },
  vodTime: { color: '#d6dbe3', fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'center' },
  vodTrack: { flex: 1, height: 16, justifyContent: 'center', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8 },
  vodFill: { height: 4, backgroundColor: t.colors.accent },
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
