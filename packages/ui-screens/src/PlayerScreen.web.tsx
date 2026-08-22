/**
 * Pure-headed player screen (web/Tauri): renders the PlayerController state
 * machine and forwards HTML5 <video> events back to the controller. The only
 * platform-specific visual element (<video> + hls.js for HLS) lives here by
 * design; behavior stays in @eagle/headless-ui.
 *
 * Controls are fully self-drawn (no native `controls` attribute): top bar
 * with back + channel name, center play/pause, LIVE badge. No seek bar
 * (live TV).
 */
import React, { useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import type Hls from 'hls.js';
import type { Channel } from '@eagle/core';
import type { PlayerController, PlayerControlsController } from '@eagle/headless-ui';
import { usePlayer, usePlayerControls } from '@eagle/headless-ui';

/**
 * Browser-dev CORS escape hatch (inline copy — desktop shell owns the proxy).
 * IPTV origins rarely send CORS headers; in plain-browser dev we route
 * through the vite dev server's /eagle-proxy/. Tauri WebView passes through.
 */
const isPlainBrowserDev: boolean =
  typeof window !== 'undefined' &&
  !('__TAURI_INTERNALS__' in window) &&
  /^(localhost|127\.0\.0\.1|192\.168\.)/.test(window.location?.hostname ?? '');

function eagleUrl(url: string): string {
  if (!isPlainBrowserDev || !/^https?:\/\//i.test(url)) return url;
  // Raw (not encodeURIComponent'd): hls.js resolves relative playlist/segment
  // URLs against this path, so the origin must stay in the path structure —
  // /eagle-proxy/https://host/dir/master.m3u8 → …/dir/main.m3u8 resolves back
  // to the right proxied URL. Encoding the whole URL would break that.
  return `/eagle-proxy/${url}`;
}

/** Extract a readable message from a MediaError-ish payload. */
function describeVideoError(e: unknown): string {
  if (typeof e === 'string') return e;
  const err = (e as { details?: string; message?: string }) ?? {};
  return err.details ?? err.message ?? '未知错误';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  // Retry counter: `open()` on the same channel reuses the resolved URL, and
  // assigning the same value to video.src does NOT reload — so we bump this
  // to force the attach-effect to run (fresh hls.js instance / real reload).
  const [reloadKey, setReloadKey] = React.useReducer((k: number) => k + 1, 0);

  useEffect(() => {
    void controller.open(channel);
  }, [controller, channel]);

  const url = state.stream?.url ?? null;
  // Source-level request headers (e.g. Jellyfin 12 Authorization header).
  // <video> can't send custom headers, so header-carrying streams MUST go
  // through hls.js — we force that below.
  const streamHeaders = state.stream?.headers ?? null;

  // Attach the stream: native HLS on Safari, hls.js (MSE) everywhere else.
  // eagleUrl: plain-browser dev routes through the vite CORS proxy.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || state.status === 'error') return;

    const fetchUrl = eagleUrl(url);
    const isHls = /\.m3u8(\?|$)/i.test(url);
    // Header-carrying streams (Jellyfin auth) require hls.js xhrSetup —
    // native playback can't attach headers to media requests.
    const needsHlsJs = (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) || !!streamHeaders;
    let hls: Hls | null = null;
    let disposed = false;

    if (needsHlsJs) {
      void import('hls.js').then((mod) => {
        if (disposed) return;
        const HlsCtor = mod.default;
        if (HlsCtor.isSupported()) {
          hls = new HlsCtor({
            lowLatencyMode: true,
            // Inject source headers (Jellyfin Authorization) into every
            // playlist/segment request. Inner URLs resolve against the
            // proxied path automatically (origin kept in path structure).
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
          controller.onMediaError('当前浏览器不支持 HLS 播放');
        }
      });
      return () => {
        disposed = true;
        hls?.destroy();
      };
    }

    video.src = fetchUrl;
    video.load(); // same-URL assignment alone never reloads
    return () => {
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

  // VOD progress (currentTime/duration) drives the seek bar.
  const [progress, setProgress] = React.useState({ t: 0, dur: 0 });
  // Video fit: contain (whole frame) is the standard default; cover is opt-in.
  const [cover, setCover] = React.useState(false);
  const isVod = channel.isVod === true;
  const fmt = (s: number): string => {
    if (!Number.isFinite(s)) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const playing = state.status === 'playing';

  return (
    <div
      className="player-root"
      onClick={(e) => {
        if (e.target === e.currentTarget) controls.toggle();
      }}
    >
      {state.status === 'resolving' && <div className="spinner" />}
      {state.status === 'error' && (
        <div className="error-box">
          <div className="error-main">播放失败{state.errorMessage ? `\n${state.errorMessage}` : ''}</div>
          <div className="error-hint">{isVod
            ? '媒体文件可能无法直接播放（编码不兼容）或网络不可达，可尝试重试。'
            : '直播源地址可能失效或网络不可达，可尝试重试或换一个频道。'}</div>
          <button className="recheck-btn" onClick={() => { void controller.open(channel); setReloadKey(); }}>
            重试
          </button>
        </div>
      )}
      {state.stream && state.status !== 'error' && (
        <video
          ref={videoRef}
          className="player-video"
          style={{ objectFit: cover ? 'cover' : 'contain' }}
          playsInline
          autoPlay
          // 点视频本体也要能唤出/收起控制条（video 占满画面，根容器空白几乎点不到）。
          onClick={() => controls.toggle()}
          onPlaying={() => controller.onMediaPlaying()}
          onPause={() => controller.onMediaPaused()}
          onWaiting={() => controller.onMediaLoading()}
          onTimeUpdate={() => {
            // currentTarget is nulled after async dispatch — use the ref.
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
            <button className="player-back" onClick={onBack}>
              ‹ 返回
            </button>
            <span className="player-title">{channel.name}</span>
            {playing && !isVod && <span className="live">LIVE</span>}
            <button
              className="vod-tool"
              onClick={() => setCover((c) => !c)}
              title={cover ? '切换为画面适应（完整显示）' : '切换为填充屏幕（裁切边缘）'}
            >{cover ? '⬛' : '⤢'}</button>
          </div>
          <button className="center-btn" onClick={() => controls.togglePlayPause()}>
            {ui.paused ? <Play size={26} color='#fff' /> : <Pause size={26} color='#fff' />}
          </button>
          {isVod && (
            <div className="vod-bar">
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
