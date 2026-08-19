import { describe, expect, it } from 'vitest';
import { EagleCore } from './eagle.js';
import type { SourcePlugin, PluginConnection, LiveSource } from './index.js';
import { MemoryPort } from './port-memory.js';
import { MemorySettingsStore } from './settings-memory.js';
import { LiveSourceBase } from './source.js';
import type { ChannelPage, Port, StreamUrl } from './types.js';

/** Minimal fake plugin used to test the registry generically. */
class FakeSource extends LiveSourceBase {
  readonly kind = 'jellyfin' as const;
  constructor(readonly sourceId: string, private readonly channels: ChannelPage['channels']) {
    super();
  }
  async listChannels(): Promise<ChannelPage> {
    return { channels: this.channels, nextCursor: undefined };
  }
  async resolveStream(channelId: string): Promise<StreamUrl> {
    return { url: `http://fake/${channelId}`, kind: 'm3u' };
  }
}

function fakePlugin(prefix: string, names: string[]): SourcePlugin {
  return {
    kind: `fake-${prefix}`,
    displayName: `Fake ${prefix}`,
    channelIdPrefix: prefix,
    async connect(port: Port): Promise<PluginConnection> {
      return { id: `fake-${prefix}:${port.hash(prefix)}`, label: `Fake ${prefix}`, state: { names } };
    },
    create(_port: Port, connection: PluginConnection): LiveSource {
      const chans = (connection.state as { names: string[] }).names.map((n, i) => ({
        id: `${prefix}:${i}`,
        source: 'm3u' as const,
        name: n,
      }));
      return new FakeSource(connection.id, chans);
    },
  };
}

describe('EagleCore plugin registry', () => {
  it('registers plugins and lists them', () => {
    const core = new EagleCore(new MemoryPort(), new MemorySettingsStore());
    const p = fakePlugin('aa', ['A1']);
    core.use(p);
    expect(core.listPlugins().map((x) => x.kind)).toEqual(['fake-aa']);
  });

  it('addSource routes through the plugin, persists and lists channels', async () => {
    const port = new MemoryPort();
    const settings = new MemorySettingsStore();
    const core = new EagleCore(port, settings).use(fakePlugin('aa', ['A1', 'A2']));
    const ref = await core.addSource('fake-aa', {});
    expect(ref.kind).toBe('fake-aa');
    const channels = await core.listChannels();
    expect(channels.map((c) => c.name)).toEqual(['A1', 'A2']);
    expect(channels[0]?.id.startsWith('aa:')).toBe(true);
  });

  it('resolves streams via prefix routing', async () => {
    const port = new MemoryPort();
    const core = new EagleCore(port, new MemorySettingsStore()).use(fakePlugin('aa', ['A1']));
    await core.addSource('fake-aa', {});
    const stream = await core.resolveStream('aa:0');
    expect(stream.url).toBe('http://fake/aa:0');
  });

  it('rejects unknown plugin kinds', async () => {
    const core = new EagleCore(new MemoryPort(), new MemorySettingsStore());
    await expect(core.addSource('nope', {})).rejects.toThrow('No source plugin');
  });

  it('persists sources and rehydrates via create()', async () => {
    const port = new MemoryPort();
    const settings = new MemorySettingsStore();
    const core = new EagleCore(port, settings).use(fakePlugin('aa', ['A1']));
    await core.addSource('fake-aa', {});
    const core2 = new EagleCore(port, settings).use(fakePlugin('aa', ['A1']));
    await core2.hydrate();
    const channels = await core2.listChannels();
    expect(channels.map((c) => c.name)).toEqual(['A1']);
  });

  it('skips persisted sources whose plugin is not registered', async () => {
    const port = new MemoryPort();
    const settings = new MemorySettingsStore();
    const core = new EagleCore(port, settings).use(fakePlugin('aa', ['A1']));
    await core.addSource('fake-aa', {});
    const core2 = new EagleCore(port, settings); // no plugin registered
    await core2.hydrate();
    expect(await core2.listChannels()).toEqual([]);
  });

  it('merges multiple plugins and isolates failures', async () => {
    const port = new MemoryPort();
    const badPlugin = fakePlugin('bb', ['B1']);
    const origConnect = badPlugin.connect;
    badPlugin.connect = async () => {
      throw new Error('connect boom');
    };
    const core = new EagleCore(port, new MemorySettingsStore()).use(fakePlugin('aa', ['A1'])).use(badPlugin);
    await core.addSource('fake-aa', {});
    await expect(core.addSource('fake-bb', {})).rejects.toThrow('connect boom');
    const channels = await core.listChannels();
    expect(channels.map((c) => c.name)).toEqual(['A1']);
    badPlugin.connect = origConnect;
  });

  it('notifies subscribers on registry changes', async () => {
    const port = new MemoryPort();
    const core = new EagleCore(port, new MemorySettingsStore()).use(fakePlugin('aa', ['A1']));
    let notified = 0;
    core.subscribe(() => ++notified);
    await core.addSource('fake-aa', {});
    expect(notified).toBe(1);
    await core.removeSource(`fake-aa:${port.hash('aa')}`);
    expect(notified).toBe(2);
  });
});
