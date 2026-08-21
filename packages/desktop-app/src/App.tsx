/**
 * Eagle desktop head (Tauri shell) — composition root only, mirroring
 * rn-ui-plugin's EagleApp: platform bridge (platform.ts) + EagleCore +
 * source plugins + headless controllers + the SHARED screens from
 * @eagle/ui-screens, rendered through react-native-web.
 *
 * Desktop-only chrome lives here: app bar, centered content column,
 * browser-back handling. All screen UI is single-source in ui-screens.
 */
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EagleCore } from '@eagle/core';
import type { Channel, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { jellyfinVideoPlugin } from '@eagle/jellyfin-video-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { ChannelListScreen, PlayerScreen, SettingsScreen, ToastProvider } from '@eagle/ui-screens';
import { TauriPort, createSettingsStore, eagleUrl } from './platform.js';
import './app.css';

/** Source-plugin composition for the MVP build (same set as the RN head). */
export const MVP_PLUGINS: SourcePlugin[] = [jellyfinPlugin, jellyfinVideoPlugin, m3uTunerPlugin, hdHomeRunPlugin];

type Route = 'list' | 'player' | 'settings';

export function EagleDesktopApp(): React.JSX.Element {
  const [controllers, setControllers] = useState<EagleControllers | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const core = new EagleCore(new TauriPort(), createSettingsStore());
        for (const p of MVP_PLUGINS) core.use(p);
        await core.hydrate();
        setControllers(createEagleControllers(core, { mapProbeUrl: eagleUrl }));
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
      <SafeAreaProvider>
        <View style={styles.root}>
          <Text style={styles.error}>启动失败：{bootError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }
  if (!controllers) {
    return (
      <SafeAreaProvider>
        <View style={styles.root}>
          <Text style={styles.hint}>Eagle 启动中…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const play = (channel: Channel): void => {
    setCurrent(channel);
    setRoute('player');
  };

  // Player is fullscreen chrome-less; other routes get the desktop shell.
  if (route === 'player' && current) {
    return (
      <SafeAreaProvider>
        <View style={styles.playerRoot}>
          <PlayerScreen
            controller={controllers.player}
            controls={controllers.playerControls}
            channel={current}
            onBack={() => setRoute('list')}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
      <View style={styles.root}>
        <View style={styles.shell}>
          {route === 'settings' ? (
            <SettingsScreen
              form={controllers.addSourceForm}
              sources={controllers.sources}
              health={controllers.health}
              onBack={() => setRoute('list')}
            />
          ) : (
            <>
              <View style={styles.appBar}>
                <Text style={styles.brand}>Eagle</Text>
                <Text style={styles.brandSub}>直播</Text>
              </View>
              <ChannelListScreen
                controller={controllers.channelList}
                health={controllers.health}
                onPlay={play}
                onOpenSettings={() => setRoute('settings')}
              />
            </>
          )}
        </View>
      </View>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = {
  root: { flex: 1, backgroundColor: '#0e1116' } as const,
  playerRoot: { flex: 1, backgroundColor: '#000' } as const,
  shell: {
    width: '100%',
    maxWidth: 1180,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flex: 1,
  } as const,
  appBar: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 8,
    paddingBottom: 16,
  },
  brand: { color: '#e8ecf1', fontSize: 22, fontWeight: '700' as const },
  brandSub: { color: '#5b6472', fontSize: 11 },
  hint: { color: '#8b95a5' },
  error: { color: '#ff6b6b' },
};
