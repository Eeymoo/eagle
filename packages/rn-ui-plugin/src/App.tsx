/**
 * Eagle RN head — composition root only.
 *
 * This component does exactly three things:
 *   1. builds the platform Port/Settings (platform.ts)
 *   2. composes EagleCore + source plugins (MVP_PLUGINS)
 *   3. hands headless controllers (@eagle/headless-ui) to pure-headed screens
 *
 * All behavior lives in headless controllers; all styling lives in design
 * tokens; this file is pure wiring — which is exactly what a "head" should be.
 *
 * Navigation mirrors the desktop shell: shared @eagle/ui-nav bottom tabs
 * (媒体库 / 直播 / 设置) plus an internal stack for library browse /
 * series / detail / player routes, driven by plain state (no router dep).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ToastProvider } from '@eagle/ui-screens';
import * as Application from 'expo-application';
import { EagleCore } from '@eagle/core';
import type { Channel, LibraryItem, MediaLibrary, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { jellyfinVideoPlugin } from '@eagle/jellyfin-video-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import { useChannelList, useLibrary, useWatchProgress } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { ReactNativePort, createSettingsStore } from './platform.js';
import { AppShellLayout, AppShellNav } from '@eagle/ui-nav';
import type { NavItem } from '@eagle/ui-nav';
import { Library as IconLibrary, Tv as IconTv, Settings as IconSettings } from '@eagle/icons';
import {
  ChannelListScreen,
  DetailScreen,
  LibraryBrowseScreen,
  LibraryHomeScreen,
  PlayerScreen,
  SeriesScreen,
  SettingsScreen,
  VodPlayerScreen,
} from '@eagle/ui-screens';

/** Source-plugin composition for the MVP build. */
export const MVP_PLUGINS: SourcePlugin[] = [jellyfinPlugin, jellyfinVideoPlugin, m3uTunerPlugin, hdHomeRunPlugin];

/**
 * Boot-stage breadcrumbs: if the app crashes at startup, GlitchTip shows the
 * last reached stage. No-op (console only) when Sentry is not configured.
 */
function bootTrace(): (msg: string) => void {
  const scope = globalThis as { __EAGLE_SENTRY__?: { addBreadcrumb(m: unknown): void } };
  return (msg: string) => {
    console.log(`[eagle:boot] ${msg}`);
    scope.__EAGLE_SENTRY__?.addBreadcrumb({ category: 'boot', message: msg, level: 'info' });
  };
}

/**
 * Navigation state — a flat route object instead of a router dependency.
 * Tab routes (library/live/settings) are the shell roots; stack routes
 * (browse/series/detail/player) layer on top and pop back to their tab.
 */
type TabId = 'library' | 'live' | 'settings';

interface TabRoute {
  kind: 'tab';
  tab: TabId;
}
interface BrowseRoute {
  kind: 'browse';
  library: MediaLibrary;
}
interface SeriesRoute {
  kind: 'series';
  item: LibraryItem;
}
interface DetailRoute {
  kind: 'detail';
  item: LibraryItem;
}
interface PlayerRouteState {
  kind: 'player';
  channel: Channel;
  startAtSec: number;
}

type Route = TabRoute | BrowseRoute | SeriesRoute | DetailRoute | PlayerRouteState;

export function EagleApp(): React.JSX.Element {
  const [controllers, setControllers] = useState<EagleControllers | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const trace = bootTrace();
      try {
        trace('creating settings store');
        const settings = await createSettingsStore();
        trace('composing core');
        const core = new EagleCore(new ReactNativePort(), settings);
        for (const p of MVP_PLUGINS) core.use(p);
        trace(`hydrating (${MVP_PLUGINS.length} plugins)`);
        await core.hydrate();
        trace('boot complete');
        setControllers(createEagleControllers(core));
      } catch (e) {
        trace(`boot failed: ${e instanceof Error ? e.message : String(e)}`);
        setBootError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'library' });

  // Android hardware back / gesture: pop stack routes to their tab; on a
  // tab root fall through to the default behavior (exit/background).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.kind === 'tab') return false;
      setRoute({ kind: 'tab', tab: 'library' });
      return true; // handled
    });
    return () => sub.remove();
  }, [route]);

  if (bootError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>启动失败：{bootError}</Text>
      </View>
    );
  }
  if (!controllers) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Eagle 启动中…</Text>
      </View>
    );
  }

  return <EagleShell controllers={controllers} route={route} setRoute={setRoute} />;
}

/** Active tab derived from the route (stack routes belong to their origin). */
function tabOf(route: Route): TabId {
  if (route.kind === 'tab') return route.tab;
  if (route.kind === 'player') return route.channel.isVod ? 'library' : 'live';
  return 'library'; // browse / series / detail all live under the library tab
}

function EagleShell({
  controllers,
  route,
  setRoute,
}: {
  controllers: EagleControllers;
  route: Route;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const activeTab = tabOf(route);

  // Library home is the default tab; refresh shelves when it becomes active.
  useEffect(() => {
    if (activeTab === 'library') void controllers.library.refresh();
  }, [controllers.library, activeTab]);

  const navItems: NavItem[] = useMemo(
    () => [
      { id: 'library', label: '媒体库', icon: IconLibrary, onPress: () => setRoute({ kind: 'tab', tab: 'library' }) },
      { id: 'live', label: '直播', icon: IconTv, onPress: () => setRoute({ kind: 'tab', tab: 'live' }) },
      { id: 'settings', label: '设置', icon: IconSettings, onPress: () => setRoute({ kind: 'tab', tab: 'settings' }) },
    ],
    [setRoute],
  );

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="light-content" />
          <AppShellLayout nav={<AppShellNav items={navItems} activeId={activeTab} />}>
            {route.kind === 'tab' && route.tab === 'library' && <LibraryTab controllers={controllers} setRoute={setRoute} />}
            {route.kind === 'tab' && route.tab === 'live' && <LiveTab controllers={controllers} setRoute={setRoute} />}
            {route.kind === 'tab' && route.tab === 'settings' && (
              <SettingsScreen
                form={controllers.addSourceForm}
                sources={controllers.sources}
                health={controllers.health}
                onBack={() => setRoute({ kind: 'tab', tab: 'library' })}
              />
            )}
            {route.kind === 'browse' && <BrowseRoute controllers={controllers} library={route.library} setRoute={setRoute} />}
            {route.kind === 'series' && <SeriesRoute controllers={controllers} item={route.item} setRoute={setRoute} />}
            {route.kind === 'detail' && <DetailRoute controllers={controllers} item={route.item} setRoute={setRoute} />}
            {route.kind === 'player' && (
              <PlayerRoute controllers={controllers} channel={route.channel} startAtSec={route.startAtSec} setRoute={setRoute} />
            )}
          </AppShellLayout>
          {route.kind !== 'player' && <Text style={styles.versionBadge}>{versionLabel()}</Text>}
        </SafeAreaView>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

// ---------------------------------------------------------------------------
// Library tab: home (继续观看/我的媒体/最近添加) — falls back to the channel
// list when no library source is configured (mirrors the desktop home rule).
// ---------------------------------------------------------------------------

function LibraryTab({
  controllers,
  setRoute,
}: {
  controllers: EagleControllers;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const lib = useLibrary(controllers.library);
  const progress = useWatchProgress(controllers.watchProgress);

  const play = useCallback(
    (channelId: string, resumeAtSec: number): void => {
      void resolveAndPlay(controllers, channelId, resumeAtSec, setRoute);
    },
    [controllers, setRoute],
  );

  // Live-only setup (no jfv source): the channel list IS the home content.
  if (lib.status === 'ready' && !lib.available) {
    return <LiveTab controllers={controllers} setRoute={setRoute} />;
  }

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
      onOpenLibrary={(l) => setRoute({ kind: 'browse', library: l })}
      onOpenSeries={(item) => setRoute({ kind: 'series', item })}
      onBack={() => setRoute({ kind: 'tab', tab: 'live' })}
      backLabel="直播 →"
    />
  );
  // progress.version intentionally observed → continue-watching rail updates
  // live after remove/record. (void progress;)
  void progress.version;
}

// ---------------------------------------------------------------------------
// Library browse (poster wall of one library) / series detail.
// ---------------------------------------------------------------------------

function BrowseRoute({
  controllers,
  library,
  setRoute,
}: {
  controllers: EagleControllers;
  library: MediaLibrary;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(undefined);
    controllers.library
      .loadItems(library.id)
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
  }, [controllers.library, library.id]);

  const play = (channelId: string, resumeAtSec: number): void => {
    void resolveAndPlay(controllers, channelId, resumeAtSec, setRoute);
  };

  return (
    <LibraryBrowseScreen
      title={library.name}
      loading={loading}
      errorMessage={error}
      items={items}
      onPlay={play}
      onOpenSeries={(item) => setRoute({ kind: 'series', item })}
      onOpenDetail={(item) => setRoute({ kind: 'detail', item })}
      onBack={() => setRoute({ kind: 'tab', tab: 'library' })}
    />
  );
}

function SeriesRoute({
  controllers,
  item,
  setRoute,
}: {
  controllers: EagleControllers;
  item: LibraryItem;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const [episodes, setEpisodes] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const progress = useWatchProgress(controllers.watchProgress);
  // Series item ids are bare Jellyfin ids here (channelId carries the jfv:
  // prefix — strip it, matching the desktop route).
  const seriesId = item.channelId.replace(/^jfv:/, '');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(undefined);
    controllers.library
      .loadEpisodes(seriesId)
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
    // recompute when progress changes (remove/record) or episodes load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes, progress.version, controllers.watchProgress]);

  const play = (channelId: string, resumeAtSec: number): void => {
    void resolveAndPlay(controllers, channelId, resumeAtSec, setRoute);
  };

  return (
    <SeriesScreen
      title={item.title}
      loading={loading}
      errorMessage={error}
      episodes={episodes}
      resumeAt={resumeAt}
      onPlay={play}
      onBack={() => setRoute({ kind: 'tab', tab: 'library' })}
    />
  );
}

function DetailRoute({
  controllers,
  item,
  setRoute,
}: {
  controllers: EagleControllers;
  item: LibraryItem;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const progress = useWatchProgress(controllers.watchProgress);
  const resumeAt = progress.entries[item.channelId]?.positionSec ?? 0;

  return (
    <DetailScreen
      item={item}
      resumeAt={resumeAt}
      onPlay={(startAtSec) => {
        void resolveAndPlay(controllers, item.channelId, startAtSec, setRoute);
      }}
      onBack={() => setRoute({ kind: 'tab', tab: 'library' })}
    />
  );
}

// ---------------------------------------------------------------------------
// Live tab: the channel list.
// ---------------------------------------------------------------------------

function LiveTab({
  controllers,
  setRoute,
}: {
  controllers: EagleControllers;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const play = (channel: Channel): void => {
    setRoute({ kind: 'player', channel, startAtSec: 0 });
  };

  return (
    <ChannelListScreen
      controller={controllers.channelList}
      health={controllers.health}
      onPlay={play}
      onOpenSettings={() => setRoute({ kind: 'tab', tab: 'settings' })}
    />
  );
}

// ---------------------------------------------------------------------------
// Player: VOD (seekable, resume-aware, reports watch progress) vs live.
// ---------------------------------------------------------------------------

function PlayerRoute({
  controllers,
  channel,
  startAtSec,
  setRoute,
}: {
  controllers: EagleControllers;
  channel: Channel;
  startAtSec: number;
  setRoute: (r: Route) => void;
}): React.JSX.Element {
  const back = () => setRoute({ kind: 'tab', tab: channel.isVod ? 'library' : 'live' });

  if (channel.isVod) {
    return (
      <VodPlayerScreen
        controller={controllers.player}
        controls={controllers.playerControls}
        channel={channel}
        onBack={back}
        startAtSec={startAtSec}
        onProgress={(pos, dur) =>
          controllers.watchProgress.record(channel.id, { name: channel.name, posterUrl: channel.logoUrl }, pos, dur)
        }
      />
    );
  }
  return (
    <PlayerScreen
      controller={controllers.player}
      controls={controllers.playerControls}
      channel={channel}
      onBack={back}
    />
  );
}

/**
 * Library play only carries a channelId — resolve the full Channel (for
 * isVod routing) via the channel-list controller's cached list.
 */
async function resolveAndPlay(
  controllers: EagleControllers,
  channelId: string,
  startAtSec: number,
  setRoute: (r: Route) => void,
): Promise<void> {
  try {
    await controllers.channelList.refresh();
    const channel = controllers.channelList.getState().channels.find((c) => c.id === channelId);
    if (channel) setRoute({ kind: 'player', channel, startAtSec });
  } catch {
    // Resolve failures surface inside the player; nothing to do here.
  }
}

/** Snapshot builds carry 0.1.N (N = run number); show it bottom-right. */
function versionLabel(): string {
  const nativeVersion = Application.nativeApplicationVersion ?? '0';
  const build = Application.nativeBuildVersion ?? '';
  return build ? `v${nativeVersion} (${build})` : `v${nativeVersion}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0e1116' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e1116' },
  hint: { color: '#8b95a5' },
  errorText: { color: '#ff6b6b' },
  versionBadge: {
    position: 'absolute',
    right: 12,
    bottom: Platform.select({ ios: 24, default: 12 }),
    color: '#5b6270',
    fontSize: 11,
    zIndex: 999,
  },
});
