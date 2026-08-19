import { describe, expect, it } from 'vitest';
import { MemoryPort } from '@eagle/core';
import { jellyfinPlugin, JellyfinSource } from './index.js';

function stubAuth(port: MemoryPort) {
  port.stubPost('http://jf.local/Users/AuthenticateByName', {
    User: { Id: 'u1', Name: 'alice' },
    AccessToken: 'tok123',
    ServerId: 'srv1',
  });
}

function stubChannels(port: MemoryPort) {
  port.stubJson('http://jf.local/LiveTv/Channels?EnableImages=true&ImageTypeLimit=1', {
    Items: [
      { Id: 'ch1', Name: 'CCTV-1', Number: '1', ImageTags: { Primary: 'img1' } },
      { Id: 'ch2', Name: 'CCTV-2', Number: '2' },
    ],
  });
}

describe('JellyfinSource', () => {
  it('authenticates and returns a session', async () => {
    const port = new MemoryPort();
    stubAuth(port);
    const session = await jellyfinPlugin.connect(port, {
      serverUrl: 'http://jf.local',
      username: 'alice',
      password: 'pw',
    });
    expect(session.id).toBe(`jellyfin:${port.hash('http://jf.local')}`);
    expect(port.postCalls[0]?.body).toEqual({ Username: 'alice', Pw: 'pw' });
  });

  it('lists channels with normalized ids', async () => {
    const port = new MemoryPort();
    stubChannels(port);
    const source = new JellyfinSource(
      port,
      { serverUrl: 'http://jf.local', userId: 'u1', accessToken: 'tok123' },
    );
    const { channels } = await source.listChannels();
    expect(channels.map((c) => c.id)).toEqual(['jf:ch1', 'jf:ch2']);
    expect(channels[0]?.logoUrl).toContain('Items/ch1/Images/Primary');
  });

  it('resolves a direct-stream URL with token', async () => {
    const port = new MemoryPort();
    const source = new JellyfinSource(port, {
      serverUrl: 'http://jf.local',
      userId: 'u1',
      accessToken: 'tok123',
    });
    const stream = await source.resolveStream('jf:ch1');
    expect(stream.url).toBe('http://jf.local/LiveTv/Channels/ch1/Play?api_key=tok123');
    expect(stream.kind).toBe('jellyfin-http');
  });

  it('connect rejects missing fields', async () => {
    await expect(jellyfinPlugin.connect(new MemoryPort(), { username: 'x' })).rejects.toThrow();
  });
});
