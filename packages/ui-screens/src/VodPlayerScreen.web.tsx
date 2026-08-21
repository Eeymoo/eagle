/**
 * VOD (video-mode) player — web implementation. Distinct from the live
 * player: seek bar with drag + buffered range, ±10s skips, playback speed,
 * volume slider + mute, fullscreen, duration display, no LIVE semantics.
 *
 * Hand-rolled chrome on purpose: Vidstack (@vidstack/react 1.15) fails to
 * mount its media provider under React 19 + vite dev (verified with a
 * minimal repro), so the controls stay ours — fully controlled, zero
 * compat risk. Uses the same headless controllers as the live player.
 */
import React, { useEffect, useRef } from 'react';
import type Hls from 'hls.js';
import type { Channel } from '@eagle/core';
import type { PlayerController, PlayerControlsController } from '@eagle/headless-ui';
import { usePlayer, usePlayerControls } from '@eagle/headless-ui';

const isPlainBrowserDev: boolean =
  typeof window !== 'undefined' &&
  !('__TAURI_INTERNALS__' in window) &&
  /^(localhost|127\.0\.0\.1|192\.168\.)/.test(window.location?.hostname ?? '');

function eagleUrl(url: string): string {
  if (!isPlainBrowserDev || !/^https?:\/\//i.test(url)) return url;
  // Raw URL keeps the origin in the path so relative resolution survives
  // proxying (see PlayerScreen.web.tsx for the full rationale).
  return `/eagle-proxy/${url}`;
}

function describeVideoError(e: unknown): string {
  if (typeof e === 'string') return e;
  const err = (e as { details?: string; message?: string }) ?? {};
  return err.details ?? err.message ?? '未知错误';
}

export interface VodPlayerScreenProps {
  controller: PlayerController;
  controls: PlayerControlsController;
  channel: Channel;
  onBack: () => void;
}

const fmt = (s: number): string => {
  if (!Number.isFinite(s)) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

export function VodPlayerScreen({ controller, controls, channel, onBack }: VodPlayerScreenProps) {
  const state = usePlayer(controller);
  const ui = usePlayerControls(controls);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Retry counter: same-URL video.src assignment never reloads — bump to force.
  const [reloadKey, setReloadKey] = React.useReducer((k: number) => k + 1, 0);
  const [progress, setProgress] = React.useState({ t: 0, dur: 0, buf: 0 });
  const [speedIdx, setSpeedIdx] = React.useState(1); // SPEEDS[1] = 1x
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);

  useEffect(() => {
    void controller.open(channel);
  }, [controller, channel]);

  const url = state.stream?.url ?? null;
  const streamHeaders = state.stream?.headers ?? null;

  // Attach the stream: native for direct files, hls.js for the transcode
  // fallback (and for header-carrying streams — <video> can't send headers).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || state.status === 'error') return;
    const fetchUrl = eagleUrl(url);
    const isHls = /\.m3u8(\?|$)/i.test(url);
    const needsHlsJs = (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) || !!streamHeaders;
    let hls: Hls | null = null;
    let disposed = false;
    if (needsHlsJs) {
      void import('hls.js').then((mod) => {
        if (disposed) return;
        const HlsCtor = mod.default;
        if (HlsCtor.isSupported()) {
          hls = new HlsCtor({
            xhrSetup: (xhr) => {
              if (streamHeaders) {
                for (const [k, v] of Object.entries(streamHeaders)) xhr.setRequestHeader(k, v);
              }
            },
          });
          hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
            if (data.fatal) controller.onMediaError(describeVideoError(data));
          });
          hls.loadSource(fetchUrl);
          hls.attachMedia(video);
        } else {
          video.src = fetchUrl;
          video.load();
        }
      });
    } else {
      video.src = fetchUrl;
      video.load();
    }
    return () => {
      disposed = true;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, controller, streamHeaders]);

  // Play/pause follows the controls state machine.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (ui.paused && !video.paused) video.pause();
    if (!ui.paused && video.paused) video.play().catch(() => undefined);
  }, [ui.paused, url]);

  const skip = (delta: number): void => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || 0;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), dur || Infinity);
  };

  const cycleSpeed = (): void => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    const video = videoRef.current;
    if (video) video.playbackRate = SPEEDS[next];
  };

  const applyVolume = (v: number): void => {
    setVolume(v);
    setMuted(v === 0);
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      video.muted = v === 0;
    }
  };

  const toggleMute = (): void => {
    const video = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (video) video.muted = next;
  };

  const toggleFullscreen = (): void => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen().catch(() => undefined);
  };

  // 双击画面左右 1/3：∓10 秒；双击中央：播放/暂停。
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });
  const onVideoTap = (e: React.MouseEvent<HTMLVideoElement>): void => {
    const now = Date.now();
    const { t, x } = lastTap.current;
    lastTap.current = { t: now, x: e.clientX };
    if (now - t < 300 && Math.abs(x - e.clientX) < 60) {
      // double-tap
      const w = window.innerWidth;
      if (e.clientX < w / 3) skip(-10);
      else if (e.clientX > (w * 2) / 3) skip(10);
      else controls.togglePlayPause();
      lastTap.current = { t: 0, x: 0 };
      return;
    }
    controls.toggle();
  };

  return (
    <div ref={rootRef} className="player-root vod-root" onClick={(e) => { if (e.target === e.currentTarget) controls.toggle(); }}>
      {state.status === 'resolving' && <div className="spinner" />}
      {state.status === 'error' && (
        <div className="error-box">
          <div className="error-main">播放失败{state.errorMessage ? `\n${state.errorMessage}` : ''}</div>
          <div className="error-hint">媒体文件可能无法直接播放（编码不兼容）或网络不可达，可尝试重试。</div>
          <button className="recheck-btn" onClick={() => { void controller.open(channel); setReloadKey(); }}>重试</button>
        </div>
      )}
      {state.stream && state.status !== 'error' && (
        <video
          ref={videoRef}
          className="player-video"
          playsInline
          autoPlay
          onClick={onVideoTap}
          onPlaying={() => controller.onMediaPlaying()}
          onPause={() => controller.onMediaPaused()}
          onWaiting={() => controller.onMediaLoading()}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            const buf = v.buffered.length > 0 ? v.buffered.end(v.buffered.length - 1) : 0;
            setProgress({ t: v.currentTime, dur: v.duration || 0, buf });
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) setProgress((p) => ({ ...p, dur: v.duration || 0 }));
          }}
          onError={() => controller.onMediaError(describeVideoError(videoRef.current?.error))}
        />
      )}

      {ui.visible && state.status !== 'error' && (
        <>
          <div className="player-bar">
            <button className="player-back" onClick={onBack}>‹ 返回</button>
            <span className="player-title">{channel.name}</span>
            <button className="vod-tool" onClick={toggleFullscreen} title="全屏">⛶</button>
          </div>
          <div className="vod-bar">
            <button className="vod-ctl" onClick={() => controls.togglePlayPause()} title={ui.paused ? '播放' : '暂停'}>
              {ui.paused ? '▶' : '❚❚'}
            </button>
            <button className="vod-skip" onClick={() => skip(-10)} title="后退 10 秒">« 10s</button>
            <span className="vod-time">{fmt(progress.t)}</span>
            <div className="vod-seekwrap">
              {/* buffered range behind the draggable thumb */}
              <div className="vod-buffer" style={{ width: `${progress.dur ? (progress.buf / progress.dur) * 100 : 0}%` }} />
              <input
                type="range"
                className="vod-seek"
                min={0}
                max={progress.dur || 0}
                step={1}
                value={Math.min(progress.t, progress.dur || 0)}
                onChange={(e) => {
                  const video = videoRef.current;
                  const t = Number(e.target.value);
                  if (video && Number.isFinite(t)) video.currentTime = t;
                }}
              />
            </div>
            <span className="vod-time">{fmt(progress.dur)}</span>
            <button className="vod-skip" onClick={() => skip(10)} title="快进 10 秒">10s »</button>
            <button className="vod-tool vod-speed" onClick={cycleSpeed} title="播放速度">
              {SPEEDS[speedIdx]}×
            </button>
            <button className="vod-tool" onClick={toggleMute} title="静音">{muted || volume === 0 ? '🔇' : '🔊'}</button>
            <input
              type="range"
              className="vod-vol"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => applyVolume(Number(e.target.value))}
              title="音量"
            />
          </div>
        </>
      )}
    </div>
  );
}
