/**
 * Pure-headed channel list (web/Tauri): renders state from the headless
 * controller, styles from generated CSS tokens. No data fetching, no
 * filtering logic here — those live in @eagle/headless-ui.
 */
import React, { useEffect } from 'react';
import type { Channel } from '@eagle/core';
import type { ChannelListController, HealthController } from '@eagle/headless-ui';
import { useChannelList, useHealth } from '@eagle/headless-ui';

export interface ChannelListScreenProps {
  controller: ChannelListController;
  health: HealthController;
  onPlay: (channel: Channel) => void;
  onOpenSettings: () => void;
}

export function ChannelListScreen({ controller, health, onPlay, onOpenSettings }: ChannelListScreenProps) {
  const state = useChannelList(controller);
  const healthState = useHealth(health);

  useEffect(() => {
    void controller.refresh().then(() => {
      // Refresh-time screening (unless disabled in settings).
      if (health.getState().checkOnRefresh) {
        void health.probe(controller.getState().channels);
      }
    });
  }, [controller, health]);

  const visible = health.filter(controller.visibleChannels());

  return (
    <div className="list-root">
      <div className="list-header">
        <input
          className="search"
          placeholder="搜索频道"
          value={state.query}
          onChange={(e) => controller.setQuery(e.target.value)}
        />
        <button className="gear" onClick={onOpenSettings} aria-label="设置">
          ⚙︎
        </button>
      </div>

      {state.status === 'loading' && <div className="hint">加载中…</div>}
      {state.status === 'error' && (
        <div className="list-error">
          出错了：{state.errorMessage}
          <br />
          <span className="retry" onClick={() => void controller.refresh(true)}>
            点击重试
          </span>
        </div>
      )}
      {state.status === 'ready' && visible.length === 0 && (
        <div className="hint">
          {healthState.hideBad
            ? '频道都被过滤了或暂无频道。可在设置中关闭"隐藏坏台"。'
            : '没有频道。请到设置添加 Jellyfin / M3U Tuner / HDHomeRun 源。'}
        </div>
      )}
      {healthState.inflight > 0 && (
        <div className="health-hint">🔍 体检中… 剩余 {healthState.inflight} 个频道</div>
      )}

      <div className="list-scroll">
        {visible.map((item) => (
          <button className="row" key={item.id} onClick={() => onPlay(item)}>
            {item.logoUrl ? (
              <img className="logo" src={item.logoUrl} alt="" loading="lazy" />
            ) : (
              <div className="logo logo-fallback">{item.name.slice(0, 1)}</div>
            )}
            <div className="row-main">
              <div className="row-name">
                {item.number ? `${item.number} · ` : ''}
                {item.name}
              </div>
              {item.group ? <div className="row-group">{item.group}</div> : null}
            </div>
            <span className="badge">{item.source}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
