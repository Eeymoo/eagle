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
import type Hls from 'hls.js';
import type { Channel } from '@eagle/core';
import type { PlayerController, PlayerControlsController } from '@eagle/headless-ui';
import { usePlayer, usePlayerControls } from '@eagle/headless-ui';

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

  useEffect(() => {
    void controller.open(channel);
  }, [controller, channel]);

  const url = state.stream?.url ?? null;

  // Attach the stream: native HLS on Safari, hls.js (MSE) everywhere else.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || state.status === 'error') return;

    const isHls = /\.m3u8(\?|$)/i.test(url);
    let hls: Hls | null = null;
    let disposed = false;

    if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
      void import('hls.js').then((mod) => {
        if (disposed) return;
        const HlsCtor = mod.default;
        if (HlsCtor.isSupported()) {
          hls = new HlsCtor({ lowLatencyMode: true });
          hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
            if (data.fatal) controller.onMediaError(describeVideoError(data));
          });
          hls.loadSource(url);
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

    video.src = url;
    return () => {
      video.removeAttribute('src');
      video.load();
    };
  }, [url, state.status, controller]);

  // Play/pause follows the controls state machine.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (ui.paused && !video.paused) video.pause();
    if (!ui.paused && video.paused) video.play().catch(() => undefined);
  }, [ui.paused, url]);

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
          <div className="error-hint">直播源地址可能失效或网络不可达，可尝试重试或换一个频道。</div>
          <button className="recheck-btn" onClick={() => void controller.open(channel)}>
            重试
          </button>
        </div>
      )}
      {state.stream && state.status !== 'error' && (
        <video
          ref={videoRef}
          className="player-video"
          playsInline
          autoPlay
          onPlaying={() => controller.onMediaPlaying()}
          onPause={() => controller.onMediaPaused()}
          onWaiting={() => controller.onMediaLoading()}
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
            {playing && <span className="live">LIVE</span>}
          </div>
          <button className="center-btn" onClick={() => controls.togglePlayPause()}>
            {ui.paused ? '▶' : '❚❚'}
          </button>
        </>
      )}
    </div>
  );
}
