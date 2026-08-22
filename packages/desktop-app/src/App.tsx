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
 *   /player/:channelId  fullscreen player (chrome-less; ?t= resume point)
 *   /library         Jellyfin-style media library home (继续观看/我的媒体/最近添加)
 *   /library/:viewId poster wall for one library
 *   /series/:seriesId  series detail (episode list)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Navigate, RouterProvider, createBrowserRouter, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EagleCore } from '@eagle/core';
import type { Channel, LibraryItem, MediaLibrary, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { jellyfinVideoPlugin } from '@eagle/jellyfin-video-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { useChannelList, useLibrary, useWatchProgress } from '@eagle/headless-ui';
import {
  ChannelListScreen, LibraryBrowseScreen, LibraryHomeScreen, PlayerScreen,
  SeriesScreen, SettingsScreen, ToastProvider, VodPlayerScreen,
} from '@eagle/ui-screens';
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
      <AppRouter controllers={controllers} />
    </SafeAreaProvider>
  );
}

/**
 * Data router (createBrowserRouter) instead of <BrowserRouter>: under
 * React 19.1 the declarative router's history subscription stopped
 * re-rendering on navigate() — URL changed, view didn't. The data router
 * is react-router 7's primary API and updates reliably.
 */
function AppRouter({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const router = useMemo(
    () =>
      createBrowserRouter([
        { path: '/', element: <ListRoute controllers={controllers} /> },
        { path: '/settings', element: <SettingsRoute controllers={controllers} /> },
        { path: '/player/:channelId', element: <PlayerRoute controllers={controllers} /> },
        { path: '/library', element: <LibraryRoute controllers={controllers} /> },
        { path: '/library/:viewId', element: <LibraryBrowseRoute controllers={controllers} /> },
        { path: '/series/:seriesId', element: <SeriesRoute controllers={controllers} /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ]),
    [controllers],
  );
  return <RouterProvider router={router} />;
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
            <View style={styles.appBarSpacer} />
            <Text
              style={styles.libraryLink}
              onPress={() => navigate('/library')}
              accessibilityRole="button"
            >
              媒体库 →
            </Text>
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
  const [searchParams] = useSearchParams();
  // Resume point from the URL (library continue-watching links carry ?t=);
  // frozen at mount so re-renders never re-seek playback. Must stay above
  // any early return — hooks order.
  const id = decodeURIComponent(channelId);
  const startAt = useMemo(
    () => Math.max(0, Number(new URLSearchParams(searchParams).get('t') ?? 0)) || 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  // Deep link lands here without the list screen ever mounting — kick the
  // (idempotent) load ourselves so the channel can be resolved.
  useEffect(() => {
    void controllers.channelList.refresh();
  }, [controllers.channelList]);

  const channel: Channel | undefined = list.channels.find((c) => c.id === id);

  // Not found once loaded, OR the list failed (bad network / dead token
  // even after re-login) → back to list where the error is visible — never
  // hang forever on 加载中.
  useEffect(() => {
    if ((list.status === 'ready' || list.status === 'error') && !channel) navigate('/', { replace: true });
  }, [list.status, channel, navigate]);

  if (!channel) {
    return (
      <View style={styles.playerRoot}>
        <Text style={styles.hint}>
          {list.status === 'error' ? `频道列表加载失败：${list.errorMessage ?? ''}` : '频道加载中…'}
        </Text>
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
          startAtSec={startAt}
          onProgress={(pos, dur) =>
            controllers.watchProgress.record(id, { name: channel.name, posterUrl: channel.logoUrl }, pos, dur)
          }
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

// ---------------------------------------------------------------------------
// Media library routes (Jellyfin-style modular home, poster walls, series).
// ---------------------------------------------------------------------------

function LibraryRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const navigate = useNavigate();
  const lib = useLibrary(controllers.library);
  const progress = useWatchProgress(controllers.watchProgress);

  useEffect(() => {
    void controllers.library.refresh();
  }, [controllers.library]);

  const play = (channelId: string, resumeAtSec: number): void => {
    const t = resumeAtSec > 0 ? `?t=${Math.floor(resumeAtSec)}` : '';
    navigate(`/player/${encodeURIComponent(channelId)}${t}`);
  };

  return (
    <LibraryHomeScreen
      available={lib.available}
      status={lib.status}
      errorMessage={lib.errorMessage}
      libraries={lib.libraries}
      recent={lib.recent}
      continueWatching={controllers.watchProgress.continueWatching()}
      onPlay={play}
      onRemoveProgress={(id) => controllers.watchProgress.remove(id)}
      onOpenLibrary={(l) => navigate(`/library/${encodeURIComponent(l.id)}`, { state: { title: l.name } })}
      onOpenSeries={(item) => navigate(`/series/${encodeURIComponent(item.channelId.replace(/^jfv:/, ''))}`, { state: { title: item.title } })}
      onBack={() => navigate('/')}
    />
  );
}

function LibraryBrowseRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const { viewId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState((location.state as { title?: string } | null)?.title ?? '媒体库');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(undefined);
    controllers.library
      .loadItems(decodeURIComponent(viewId))
      .then((out) => {
        if (alive) setItems(out);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [controllers.library, viewId]);

  const play = (channelId: string, resumeAtSec: number): void => {
    const t = resumeAtSec > 0 ? `?t=${Math.floor(resumeAtSec)}` : '';
    navigate(`/player/${encodeURIComponent(channelId)}${t}`);
  };

  return (
    <LibraryBrowseScreen
      title={title}
      loading={loading}
      errorMessage={error}
      items={items}
      onPlay={play}
      onOpenSeries={(item) => navigate(`/series/${encodeURIComponent(item.channelId.replace(/^jfv:/, ''))}`, { state: { title: item.title } })}
      onBack={() => navigate('/library')}
    />
  );
}

function SeriesRoute({ controllers }: { controllers: EagleControllers }): React.JSX.Element {
  const { seriesId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const title = (location.state as { title?: string } | null)?.title ?? '剧集';
  const [episodes, setEpisodes] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const progress = useWatchProgress(controllers.watchProgress);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(undefined);
    controllers.library
      .loadEpisodes(decodeURIComponent(seriesId))
      .then((out) => {
        if (alive) setEpisodes(out);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [controllers.library, seriesId]);

  // Resume map for the episode list (断点标记).
  const resumeAt = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ep of episodes) {
      const at = controllers.watchProgress.resumeFor(ep.channelId);
      if (at > 0) map[ep.channelId] = at;
    }
    return map;
  }, [episodes, progress.version, controllers.watchProgress]);

  return (
    <SeriesScreen
      title={title}
      loading={loading}
      errorMessage={error}
      episodes={episodes}
      resumeAt={resumeAt}
      onPlay={(channelId, resumeAtSec) => {
        const t = resumeAtSec > 0 ? `?t=${Math.floor(resumeAtSec)}` : '';
        navigate(`/player/${encodeURIComponent(channelId)}${t}`);
      }}
      onBack={() => navigate('/library')}
    />
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
  appBarSpacer: { flex: 1 } as const,
  libraryLink: { color: '#5b89ff', fontSize: 14, paddingBottom: 2 },
  brand: { color: '#e8ecf1', fontSize: 22, fontWeight: '700' as const },
  brandSub: { color: '#5b6472', fontSize: 11 },
  hint: { color: '#8b95a5' },
  error: { color: '#ff6b6b' },
};
