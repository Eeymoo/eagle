/**
 * Eagle desktop head (Tauri shell) — composition root, mirroring
 * rn-ui-plugin's EagleApp: platform bridge (platform.ts) + EagleCore +
 * source plugins + headless controllers + the SHARED screens from
 * @eagle/ui-screens, rendered through react-native-web.
 *
 * Navigation is react-router (URL-addressable: deep links, browser back,
 * bookmarks) — a desktop-only concern, so it lives in this shell. Native
 * keeps its state-machine navigation; shared screens stay navigation-
 * agnostic via callback props (onPlay / onBack / onOpenSettings).
 *
 * Routes:
 *   /                channel list
 *   /settings        source management
 *   /player/:channelId  fullscreen player (chrome-less)
 */
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EagleCore } from '@eagle/core';
import type { Channel, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { jellyfinVideoPlugin } from '@eagle/jellyfin-video-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { useChannelList } from '@eagle/headless-ui';
import { ChannelListScreen, PlayerScreen, SettingsScreen, ToastProvider, VodPlayerScreen } from '@eagle/ui-screens';
import { TauriPort, createSettingsStore, eagleUrl } from './platform.js';
import './app.css';

/** Source-plugin composition for the MVP build (same set as the RN head). */
export const MVP_PLUGINS: SourcePlugin[] = [jellyfinPlugin, jellyfinVideoPlugin, m3uTunerPlugin, hdHomeRunPlugin];

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

  return (
    <SafeAreaProvider>
      <BrowserRouter>
        <AppRoutes controllers={controllers} />
      </BrowserRouter>
    </SafeAreaProvider>
  );
}

function AppRoutes({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<ListRoute controllers={controllers} />} />
      <Route path="/settings" element={<SettingsRoute controllers={controllers} />} />
      <Route path="/player/:channelId" element={<PlayerRoute controllers={controllers} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Channel list inside the desktop shell (app bar + centered column). */
function ListRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <ToastProvider>
      <View style={styles.root}>
        <View style={styles.shell}>
          <View style={styles.appBar}>
            <Text style={styles.brand}>Eagle</Text>
            <Text style={styles.brandSub}>直播</Text>
          </View>
          <ChannelListScreen
            controller={controllers.channelList}
            health={controllers.health}
            onPlay={(channel) => navigate(`/player/${encodeURIComponent(channel.id)}`)}
            onOpenSettings={() => navigate('/settings')}
          />
        </View>
      </View>
    </ToastProvider>
  );
}

function SettingsRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <ToastProvider>
      <View style={styles.root}>
        <View style={styles.shell}>
          <SettingsScreen
            form={controllers.addSourceForm}
            sources={controllers.sources}
            health={controllers.health}
            onBack={() => navigate('/')}
          />
        </View>
      </View>
    </ToastProvider>
  );
}

/**
 * Player route: resolves the channel by URL param. Deep links land here
 * before the list has loaded — wait for it, then play. Unknown ids bounce
 * back to the list.
 */
function PlayerRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const { channelId = '' } = useParams();
  const navigate = useNavigate();
  const list = useChannelList(controllers.channelList);

  // Deep link lands here without the list screen ever mounting — kick the
  // (idempotent) load ourselves so the channel can be resolved.
  useEffect(() => {
    void controllers.channelList.refresh();
  }, [controllers.channelList]);

  const id = decodeURIComponent(channelId);
  const channel: Channel | undefined = list.channels.find((c) => c.id === id);

  // Not found once loaded → back to list (bad bookmark / removed source).
  useEffect(() => {
    if (list.status === 'ready' && !channel) navigate('/', { replace: true });
  }, [list.status, channel, navigate]);

  if (!channel) {
    return (
      <View style={styles.playerRoot}>
        <Text style={styles.hint}>频道加载中…</Text>
      </View>
    );
  }

  return (
    <View style={styles.playerRoot}>
      {channel.isVod ? (
        <VodPlayerScreen
          controller={controllers.player}
          controls={controllers.playerControls}
          channel={channel}
          onBack={() => navigate('/')}
        />
      ) : (
        <PlayerScreen
          controller={controllers.player}
          controls={controllers.playerControls}
          channel={channel}
          onBack={() => navigate('/')}
        />
      )}
    </View>
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
