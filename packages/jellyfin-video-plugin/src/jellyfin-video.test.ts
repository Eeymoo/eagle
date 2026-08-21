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
    expect(channels[0]?.isVod).toBe(true); // VOD: seek bar, no LIVE badge
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

  it('prefers static direct streaming for web-playable containers', async () => {
    const port = new MemoryPort().stubJson(
      'http://jf.local/Users/u1/Items?IncludeItemTypes=Movie%2CEpisode&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=0&Limit=500&EnableImages=true&ImageTypeLimit=1',
      {
        Items: [{ Id: 'mp4item', Name: 'Mp4 Movie', Type: 'Movie', Container: 'mov,mp4,m4a,3gp,3g2,mj2' }],
        TotalRecordCount: 1,
      },
    );
    const source = new JellyfinVideoSource(port, SESSION);
    await source.listChannels();
    const stream = await source.resolveStream('jfv:mp4item');
    expect(stream.kind).toBe('jellyfin-http');
    expect(stream.url).toBe('http://jf.local/videos/mp4item/stream.mp4?static=true&api_key=tok123');
    expect(stream.headers).toBeUndefined(); // native <video>, api_key auth
  });

  it('falls back to transcoded HLS for non-web containers', async () => {
    const port = new MemoryPort().stubJson(
      'http://jf.local/Users/u1/Items?IncludeItemTypes=Movie%2CEpisode&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=0&Limit=500&EnableImages=true&ImageTypeLimit=1',
      {
        Items: [{ Id: 'mkvitem', Name: 'Mkv Movie', Type: 'Movie', Container: 'mkv' }],
        TotalRecordCount: 1,
      },
    ).stubPost('http://jf.local/Items/mkvitem/PlaybackInfo', {
      MediaSources: [{ Id: 'ms9' }],
    });
    const source = new JellyfinVideoSource(port, SESSION);
    await source.listChannels();
    const stream = await source.resolveStream('jfv:mkvitem');
    expect(stream.kind).toBe('jellyfin-hls');
    expect(stream.url).toContain('master.m3u8');
  });
});

describe('jellyfin-video re-login', () => {
  it('re-authenticates silently when the stored token gets 401', async () => {
    // First page fetch 401s with the stale token; re-login returns a fresh
    // session and the retry succeeds.
    const LIST_URL =
      'http://jf.local/Users/u1/Items?IncludeItemTypes=Movie%2CEpisode&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=0&Limit=500&EnableImages=true&ImageTypeLimit=1';
    let calls = 0;
    const port = new MemoryPort();
    port.stubJson(LIST_URL, { Items: [{ Id: 'm0', Name: 'Movie 0', Type: 'Movie' }], TotalRecordCount: 1 });
    port.stubPost('http://jf.local/Users/AuthenticateByName', {
      User: { Id: 'u1', Name: 'user' },
      AccessToken: 'freshTok',
      ServerId: 's1',
    });
    const origGetJson = port.getJson.bind(port);
    (port as { getJson: unknown }).getJson = async (url: string, init?: { headers?: Record<string, string> }) => {
      calls++;
      if (calls === 1 && init?.headers?.Authorization?.includes('stale')) {
        // Match the shape real Ports throw on 401 (message carries the code).
        throw new Error('GET https://jf.local/... failed: 401');
      }
      return origGetJson(url);
    };
    const source = new JellyfinVideoSource(port, {
      serverUrl: 'http://jf.local',
      userId: 'u1',
      accessToken: 'stale',
      username: 'user',
      password: 'pw',
    });
    const { channels } = await source.listChannels();
    expect(channels.length).toBe(1);
    expect(calls).toBe(2); // initial 401 + retry
  });
});
