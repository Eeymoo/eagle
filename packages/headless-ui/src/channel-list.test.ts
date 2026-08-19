import { describe, expect, it, vi } from 'vitest';
import { ChannelListController } from './channel-list.js';
import type { Channel } from '@eagle/core';

const CHANNELS: Channel[] = [
  { id: 'jf:1', source: 'jellyfin', name: 'CCTV-1', group: '央视' },
  { id: 'jf:2', source: 'jellyfin', name: 'CCTV-2', group: '央视' },
  { id: 'm3u:h1', source: 'm3u', name: '湖南卫视', group: '卫视' },
  { id: 'hdhr:2.1', source: 'hdhomerun', name: 'CBS' }, // no group → 其他
];

function makeController(channels = CHANNELS) {
  return new ChannelListController({ load: vi.fn().mockResolvedValue(channels) });
}

describe('ChannelListController', () => {
  it('refresh transitions loading → ready', async () => {
    const c = makeController();
    expect(c.getState().status).toBe('idle');
    const p = c.refresh();
    expect(c.getState().status).toBe('loading');
    await p;
    expect(c.getState().status).toBe('ready');
    expect(c.getState().channels).toHaveLength(4);
  });

  it('surfaces load errors without crashing', async () => {
    const c = new ChannelListController({ load: vi.fn().mockRejectedValue(new Error('boom')) });
    await c.refresh();
    expect(c.getState().status).toBe('error');
    expect(c.getState().errorMessage).toBe('boom');
  });

  it('filters by query case-insensitively', async () => {
    const c = makeController();
    await c.refresh();
    c.setQuery('cctv');
    expect(c.visibleChannels().map((x) => x.name)).toEqual(['CCTV-1', 'CCTV-2']);
  });

  it('groups with counts, ungrouped bucketed as 其他', async () => {
    const c = makeController();
    await c.refresh();
    expect(c.groups()).toEqual([
      { name: '央视', count: 2 },
      { name: '其他', count: 1 },
      { name: '卫视', count: 1 },
    ]);
  });

  it('combines group + query filters', async () => {
    const c = makeController();
    await c.refresh();
    c.setGroup('央视');
    c.setQuery('2');
    expect(c.visibleChannels().map((x) => x.name)).toEqual(['CCTV-2']);
  });

  it('notifies subscribers on every transition', async () => {
    const c = makeController();
    const listener = vi.fn();
    c.subscribe(listener);
    await c.refresh();
    c.setQuery('x');
    // loading, ready, query = 3 transitions
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('ignores concurrent refresh calls', async () => {
    const load = vi.fn().mockImplementation(() => new Promise<Channel[]>((r) => setTimeout(() => r(CHANNELS), 10)));
    const c = new ChannelListController({ load });
    await Promise.all([c.refresh(), c.refresh()]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
