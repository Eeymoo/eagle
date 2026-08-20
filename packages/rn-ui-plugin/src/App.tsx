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
 */
import React, { useEffect, useState } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ToastProvider } from './Toast.js';
import * as Application from 'expo-application';
import { EagleCore } from '@eagle/core';
import type { Channel, SourcePlugin } from '@eagle/core';
import { jellyfinPlugin } from '@eagle/jellyfin-plugin';
import { m3uTunerPlugin } from '@eagle/m3u-tuner-plugin';
import { hdHomeRunPlugin } from '@eagle/hdhome-run-plugin';
import { createEagleControllers } from '@eagle/headless-ui';
import type { EagleControllers } from '@eagle/headless-ui';
import { ReactNativePort, createSettingsStore } from './platform.js';
import { ChannelListScreen } from './ChannelListScreen.js';
import { PlayerScreen } from './PlayerScreen.js';
import { SettingsScreen } from './SettingsScreen.js';

/** Source-plugin composition for the MVP build. */
export const MVP_PLUGINS: SourcePlugin[] = [jellyfinPlugin, m3uTunerPlugin, hdHomeRunPlugin];

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

type Route = 'list' | 'player' | 'settings';

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

  const [route, setRoute] = useState<Route>('list');
  const [current, setCurrent] = useState<Channel | null>(null);

  // Android hardware back / gesture: pop player→settings→list, exit from list.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'player' || route === 'settings') {
        setRoute('list');
        if (route === 'player') setCurrent(null);
        return true; // handled, don't exit the app
      }
      return false; // on list → default behavior (exit/background)
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

  const play = (channel: Channel): void => {
    setCurrent(channel);
    setRoute('player');
  };

  return (
    <ToastProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="light-content" />
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
          {route !== 'player' && <Text style={styles.versionBadge}>{versionLabel()}</Text>}
        </SafeAreaView>
      </SafeAreaProvider>
    </ToastProvider>
  );
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
