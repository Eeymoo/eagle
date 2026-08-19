/** Composition-root integration test: controllers wired against a real EagleCore. */
import { describe, expect, it } from 'vitest';
import { createEagleControllers } from './controllers.js';
import { EagleCore, MemoryPort, MemorySettingsStore } from '@eagle/core';
import type { SourcePlugin, PluginConnection, LiveSource } from '@eagle/core';
import { LiveSourceBase } from '@eagle/core';

const PLAYLIST = '#EXTM3U\n#EXTINF:-1 group-title="央视",CCTV-1\nhttp://cdn/1.ts\n';

class StubSource extends LiveSourceBase {
  readonly kind = 'm3u' as const;
  constructor(readonly sourceId: string) {
    super();
  }
  async listChannels() {
    return { channels: [{ id: 'm3u:x', source: 'm3u' as const, name: 'CCTV-1' }], nextCursor: undefined };
  }
  async resolveStream(id: string) {
    return { url: `http://cdn/${id}`, kind: 'm3u' as const };
  }
}

const stubPlugin: SourcePlugin = {
  kind: 'm3u-tuner',
  displayName: 'M3U Tuner',
  channelIdPrefix: 'm3u',
  formFields: [{ key: 'playlistUrl', label: 'URL' }],
  async connect(port): Promise<PluginConnection> {
    await port.getText('http://list/tv.m3u'); // probe
    return { id: `m3u-tuner:${port.hash('http://list/tv.m3u')}`, label: 'list', state: { playlistUrl: 'http://list/tv.m3u' } };
  },
  create(port: import('@eagle/core').Port, connection: PluginConnection): LiveSource {
    return new StubSource(connection.id);
  },
};

describe('createEagleControllers', () => {
  it('wires add-source success → channel list refresh', async () => {
    const port = new MemoryPort().stubText('http://list/tv.m3u', PLAYLIST);
    const core = new EagleCore(port, new MemorySettingsStore()).use(stubPlugin);
    const { channelList, addSourceForm, player } = createEagleControllers(core);

    addSourceForm.select('m3u-tuner');
    addSourceForm.setValue('playlistUrl', 'http://list/tv.m3u');
    await addSourceForm.submit();
    expect(addSourceForm.getState().status).toBe('success');

    // The core.subscribe wiring should have refreshed the list.
    expect(channelList.getState().status).toBe('ready');
    expect(channelList.getState().channels.map((c) => c.name)).toEqual(['CCTV-1']);

    // Player resolves through the same core.
    await player.open(channelList.getState().channels[0]!);
    expect(player.getState().stream?.url).toBe('http://cdn/m3u:x');
  });
});
