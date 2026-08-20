/**
 * Eagle Tauri head — composition root only (web mirror of rn-ui-plugin's
 * EagleApp). Does exactly three things:
 *   1. builds the platform Port/Settings (platform.ts)
 *   2. composes EagleCore + source plugins (MVP_PLUGINS)
 *   3. hands headless controllers (@eagle/headless-ui) to pure-headed screens
 *
 * Routing is react-navigation-free: a simple state route (list/player/
 * settings) + browser history (popstate → back). All behavior lives in
 * headless controllers; all styling in generated tokens.
 */
import React, { useEffect, useState } from 'react';
import { EagleCore } from '@eagle/core';
import type { Channel, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { TauriPort, createSettingsStore } from './platform.js';
import { ChannelListScreen } from './ChannelListScreen.js';
import { PlayerScreen } from './PlayerScreen.js';
import { SettingsScreen } from './SettingsScreen.js';

/** Source-plugin composition for the MVP build (same set as the RN head). */
export const MVP_PLUGINS: SourcePlugin[] = [jellyfinPlugin, m3uTunerPlugin, hdHomeRunPlugin];

type Route = 'list' | 'player' | 'settings';

export function EagleTauriApp(): React.JSX.Element {
  const [controllers, setControllers] = useState<EagleControllers | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const core = new EagleCore(new TauriPort(), createSettingsStore());
        for (const p of MVP_PLUGINS) core.use(p);
        await core.hydrate();
        setControllers(createEagleControllers(core));
      } catch (e) {
        setBootError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const [route, setRoute] = useState<Route>('list');
  const [current, setCurrent] = useState<Channel | null>(null);

  // Browser/desktop back button: pop player→settings→list.
  useEffect(() => {
    const onPop = (): void => setRoute((r) => (r === 'list' ? r : 'list'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (bootError) {
    return (
      <div className="eagle-root">
        <div className="eagle-center eagle-error">启动失败：{bootError}</div>
      </div>
    );
  }
  if (!controllers) {
    return (
      <div className="eagle-root">
        <div className="eagle-center">Eagle 启动中…</div>
      </div>
    );
  }

  const play = (channel: Channel): void => {
    setCurrent(channel);
    setRoute('player');
  };

  return (
    <div className="eagle-root">
      {route === 'list' && (
        <ChannelListScreen
          controller={controllers.channelList}
          health={controllers.health}
          onPlay={play}
          onOpenSettings={() => setRoute('settings')}
        />
      )}
      {route === 'player' && current && (
        <PlayerScreen
          controller={controllers.player}
          controls={controllers.playerControls}
          channel={current}
          onBack={() => setRoute('list')}
        />
      )}
      {route === 'settings' && (
        <SettingsScreen
          form={controllers.addSourceForm}
          sources={controllers.sources}
          health={controllers.health}
          onBack={() => setRoute('list')}
        />
      )}
    </div>
  );
}
