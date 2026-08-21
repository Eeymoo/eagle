/**
 * VOD (video-mode) player — web implementation. Distinct from the live
 * player (PlayerScreen.web.tsx): seek bar with drag, ±10s skips, duration
 * display, no LIVE semantics. Uses the same headless controllers, so state
 * handling (resolve/retry/error) mirrors the live player.
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

export function VodPlayerScreen({ controller, controls, channel, onBack }: VodPlayerScreenProps) {
  const state = usePlayer(controller);
  const ui = usePlayerControls(controls);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reloadKey, setReloadKey] = React.useReducer((k: number) => k + 1, 0);
  const [progress, setProgress] = React.useState({ t: 0, dur: 0 });

  useEffect(() => {
    void controller.open(channel);
  }, [controller, channel]);

  const url = state.stream?.url ?? null;
  const streamHeaders = state.stream?.headers ?? null;

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

  return (
    <div className="player-root" onClick={(e) => { if (e.target === e.currentTarget) controls.toggle(); }}>
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
          // 点视频本体也要能唤出/收起控制条（video 占满画面，根容器空白几乎点不到）。
          onClick={() => controls.toggle()}
          onPlaying={() => controller.onMediaPlaying()}
          onPause={() => controller.onMediaPaused()}
          onWaiting={() => controller.onMediaLoading()}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v) setProgress({ t: v.currentTime, dur: v.duration || 0 });
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
          </div>
          {/* 播放/暂停并入底部控制条，中央不再放常驻按钮（不挡画面）。 */}
          <div className="vod-bar">
            <button className="vod-ctl" onClick={() => controls.togglePlayPause()} title={ui.paused ? '播放' : '暂停'}>
              {ui.paused ? '▶' : '❚❚'}
            </button>
            <button className="vod-skip" onClick={() => skip(-10)} title="后退 10 秒">« 10s</button>
            <span className="vod-time">{fmt(progress.t)}</span>
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
            <span className="vod-time">{fmt(progress.dur)}</span>
            <button className="vod-skip" onClick={() => skip(10)} title="快进 10 秒">10s »</button>
          </div>
        </>
      )}
    </div>
  );
}
