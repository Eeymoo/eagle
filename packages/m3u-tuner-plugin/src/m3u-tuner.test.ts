import { describe, expect, it } from 'vitest';
import { parseM3U, m3uTunerPlugin, M3USource } from './m3u-tuner.js';
import { MemoryPort } from '@eagle/core';

const PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="cctv1" tvg-logo="http://logo/1.png" group-title="央视",CCTV-1 综合
http://example.com/stream/cctv1.ts
#EXTINF:-1 group-title="央视",CCTV-2 财经
http://example.com/stream/cctv2.ts
#EXTINF:-1 tvg-id="hntv" 湖南卫视
http://example.com/stream/hntv.ts
`;

describe('parseM3U', () => {
  it('parses names, groups and logos', () => {
    const entries = parseM3U(PLAYLIST);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      name: 'CCTV-1 综合',
      group: '央视',
      logoUrl: 'http://logo/1.png',
      tvgId: 'cctv1',
      url: 'http://example.com/stream/cctv1.ts',
    });
  });

  it('tolerates entries without attrs', () => {
    const entries = parseM3U(PLAYLIST);
    expect(entries[2]?.name).toBe('湖南卫视');
    expect(entries[2]?.group).toBeUndefined();
  });

  it('ignores comments and blank lines', () => {
    const entries = parseM3U('#EXTM3U\n\n#Some comment\nhttp://a/1.m3u8\n');
    expect(entries).toEqual([{ name: 'http://a/1.m3u8', url: 'http://a/1.m3u8' }]);
  });

  it('returns empty for empty input', () => {
    expect(parseM3U('')).toEqual([]);
  });
});

describe('m3uTunerPlugin', () => {
  it('connect validates the playlist and returns stable id', async () => {
    const port = new MemoryPort().stubText('http://list.example/tv.m3u', PLAYLIST);
    const conn = await m3uTunerPlugin.connect(port, { playlistUrl: 'http://list.example/tv.m3u' });
    expect(conn.id).toBe(`m3u-tuner:${port.hash('http://list.example/tv.m3u')}`);
    expect(conn.state).toEqual({ playlistUrl: 'http://list.example/tv.m3u' });
  });

  it('connect rejects non-http input', async () => {
    const port = new MemoryPort();
    await expect(m3uTunerPlugin.connect(port, { playlistUrl: 'ftp://x' })).rejects.toThrow();
  });

  it('create rehydrates a working source', async () => {
    const port = new MemoryPort().stubText('http://list.example/tv.m3u', PLAYLIST);
    const conn = await m3uTunerPlugin.connect(port, { playlistUrl: 'http://list.example/tv.m3u' });
    const source = m3uTunerPlugin.create(port, conn);
    const { channels } = await source.listChannels();
    expect(channels.map((c) => c.name)).toEqual(['CCTV-1 综合', 'CCTV-2 财经', '湖南卫视']);
    const stream = await source.resolveStream(channels[0]!.id);
    expect(stream.url).toBe('http://example.com/stream/cctv1.ts');
  });

  it('reuses the cached playlist within TTL', async () => {
    let fetches = 0;
    const port = new MemoryPort();
    port.stubText('http://list.example/tv.m3u', () => {
      fetches++;
      return PLAYLIST;
    });
    const source = new M3USource(port, 'http://list.example/tv.m3u');
    await source.listChannels();
    await source.listChannels();
    expect(fetches).toBe(1);
  });
});
