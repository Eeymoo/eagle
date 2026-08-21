import { describe, expect, it } from 'vitest';
import { MemoryPort } from '@eagle/core';
import { JellyfinVideoSource, jellyfinVideoPlugin } from './jellyfin-video.js';

const SESSION = {
  serverUrl: 'http://jf.local',
  userId: 'u1',
  accessToken: 'tok123',
};

const ITEMS_PAGE = (start: number, n: number, total: number) => ({
  Items: Array.from({ length: n }, (_, i) => ({
    Id: `m${start + i}`,
    Name: `Movie ${start + i}`,
    Type: 'Movie',
    ProductionYear: 2020 + ((start + i) % 5),
    ImageTags: { Primary: `tag${start + i}` },
  })),
  TotalRecordCount: total,
});

function makePort(total: number): MemoryPort {
  const port = new MemoryPort();
  for (let start = 0; start < total; start += 500) {
    const n = Math.min(500, total - start);
    port.stubJson(
      `http://jf.local/Users/u1/Items?IncludeItemTypes=Movie%2CEpisode&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=${start}&Limit=500&EnableImages=true&ImageTypeLimit=1`,
      ITEMS_PAGE(start, n, total),
    );
  }
  return port;
}

describe('jellyfin-video', () => {
  it('lists movies with year suffix and 电影 group', async () => {
    const source = new JellyfinVideoSource(makePort(2), SESSION);
    const { channels } = await source.listChannels();
    expect(channels.map((c) => c.id)).toEqual(['jfv:m0', 'jfv:m1']);
    expect(channels[0]?.name).toBe('Movie 0 (2020)');
    expect(channels[0]?.group).toBe('电影');
    expect(channels[0]?.logoUrl).toContain('Items/m0/Images/Primary');
    expect(channels.every((c) => c.source === 'jellyfin-video')).toBe(true);
  });

  it('pages internally until exhausted', async () => {
    const source = new JellyfinVideoSource(makePort(501), SESSION);
    const { channels } = await source.listChannels();
    expect(channels.length).toBe(501);
  });

  it('formats episodes as SxxEyy with series group', async () => {
    const port = new MemoryPort().stubJson(
      'http://jf.local/Users/u1/Items?IncludeItemTypes=Movie%2CEpisode&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=0&Limit=500&EnableImages=true&ImageTypeLimit=1',
      {
        Items: [
          { Id: 'e1', Name: 'Pilot', Type: 'Episode', SeriesName: 'Show X', ParentIndexNumber: 1, IndexNumber: 2 },
        ],
        TotalRecordCount: 1,
      },
    );
    const source = new JellyfinVideoSource(port, SESSION);
    const { channels } = await source.listChannels();
    expect(channels[0]?.name).toBe('S01E02 Pilot');
    expect(channels[0]?.group).toBe('Show X');
  });

  it('resolves master.m3u8 with Authorization header (Jellyfin 12)', async () => {
    const port = makePort(1).stubPost('http://jf.local/Items/m0/PlaybackInfo', {
      MediaSources: [{ Id: 'ms1' }],
    });
    const source = new JellyfinVideoSource(port, SESSION);
    await source.listChannels();
    const stream = await source.resolveStream('jfv:m0');
    expect(stream.url).toBe('http://jf.local/videos/m0/master.m3u8?MediaSourceId=ms1');
    expect(stream.kind).toBe('jellyfin-hls');
    expect(stream.headers?.Authorization).toBe('MediaBrowser Token="tok123"');
  });

  it('plugin.create rehydrates from persisted session', async () => {
    const source = jellyfinVideoPlugin.create(new MemoryPort(), {
      id: 'jellyfin-video:x',
      label: 'lib',
      state: { session: SESSION },
    });
    expect(source.kind).toBe('jellyfin-video');
  });
});
