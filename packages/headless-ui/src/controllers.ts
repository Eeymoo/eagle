/**
 * Composition root for the headless layer: wires controllers to an EagleCore
 * instance. Heads call createEagleControllers(core) once and pass the bundle
 * down. Zero rendering, zero platform APIs — pure wiring.
 */
import { ChannelListController } from './channel-list.js';
import { AddSourceFormController } from './add-source-form.js';
import { PlayerController } from './player.js';
import { SourcesController } from './sources.js';
import { HealthController } from './health.js';
import { PlayerControlsController } from './player-controls.js';
import type { EagleCore } from '@eagle/core';

export interface EagleControllers {
  channelList: ChannelListController;
  addSourceForm: AddSourceFormController;
  sources: SourcesController;
  player: PlayerController;
  health: HealthController;
  playerControls: PlayerControlsController;
}

export interface CreateEagleControllersOptions {
  /**
   * Optional URL rewrite for health probes (e.g. web CORS proxy).
   * Passed through to HealthController.
   */
  mapProbeUrl?: (url: string) => string;
}

export function createEagleControllers(
  core: EagleCore,
  opts: CreateEagleControllersOptions = {},
): EagleControllers {
  const channelList = new ChannelListController({ load: () => core.listChannels() });
  const addSourceForm = new AddSourceFormController({
    plugins: core.listPlugins(),
    submit: (kind, values) => core.addSource(kind, values).then(() => ({
      // addSource returns SourceRef; forms only need a completion signal.
      id: kind,
      label: kind,
      state: values,
    })),
  });
  const sources = new SourcesController({
    list: () => core.listSources(),
    remove: (id) => core.removeSource(id),
    subscribe: (l) => core.subscribe(l),
  });
  const player = new PlayerController({ resolve: (id) => core.resolveStream(id) });
  const playerControls = new PlayerControlsController({ hideDelayMs: 3000 });
  const health = new HealthController({
    port: {
      // Health checks only need `now` from the port; reuse core's fetch via
      // global (RN port delegates to fetch anyway).
      getText: async (url) => (await fetch(url)).text(),
      getJson: async <T,>(url: string) => (await fetch(url)).json() as Promise<T>,
      now: () => Date.now(),
      hash: (s: string) => {
        // FNV-1a — matches port behavior; only used for probe bookkeeping.
        let h = 0x811c9dc5;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(16);
      },
    },
    resolveStream: (id) => core.resolveStream(id),
    mapUrl: opts.mapProbeUrl,
    settings: {
      get: async <T,>(key: string, fallback: T) =>
        ((await core.settingsStore.get<T>(key)) ?? fallback),
      set: <T,>(key: string, value: T) => core.settingsStore.set(key, value),
    },
  });

  // Cross-controller wiring ----------------------------------------------

  // A newly added source refreshes the channel list, then health-checks the
  // new channels automatically (first-time screening).
  core.subscribe(() => {
    void channelList.refresh().then(() => {
      if (health.getState().checkOnRefresh) {
        void health.probe(channelList.getState().channels ?? []);
      }
    });
  });

  // Playback failure penalizes the channel (hidden if hideBad).
  player.subscribe(() => {
    const st = player.getState();
    if (!st.channel) return;
    if (st.status === 'error') health.markBad(st.channel.id);
    if (st.status === 'playing') health.markOk(st.channel.id);
  });

  return { channelList, addSourceForm, sources, player, health, playerControls };
}
