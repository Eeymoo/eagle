/**
 * Composition root for the headless layer: wires controllers to an EagleCore
 * instance. Heads call createEagleControllers(core) once and pass the bundle
 * down. Zero rendering, zero platform APIs — pure wiring.
 */
import { ChannelListController } from './channel-list.js';
import { AddSourceFormController } from './add-source-form.js';
import { PlayerController } from './player.js';
import { SourcesController } from './sources.js';
import type { EagleCore } from '@eagle/core';

export interface EagleControllers {
  channelList: ChannelListController;
  addSourceForm: AddSourceFormController;
  sources: SourcesController;
  player: PlayerController;
}

export function createEagleControllers(core: EagleCore): EagleControllers {
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

  // Cross-controller wiring: a newly added source refreshes the channel list.
  core.subscribe(() => {
    void channelList.refresh();
  });

  return { channelList, addSourceForm, sources, player };
}
