import { describe, expect, it, vi } from 'vitest';
import { PlayerController } from './player.js';
import type { Channel, StreamUrl } from '@eagle/core';

const CH: Channel = { id: 'jf:1', source: 'jellyfin', name: 'CCTV-1' };
const STREAM: StreamUrl = { url: 'http://s/1', kind: 'jellyfin-http' };

describe('PlayerController', () => {
  it('open resolves stream and transitions to loading-media', async () => {
    const c = new PlayerController({ resolve: vi.fn().mockResolvedValue(STREAM) });
    const p = c.open(CH);
    expect(c.getState().status).toBe('resolving');
    await p;
    expect(c.getState().status).toBe('loading-media');
    expect(c.getState().stream?.url).toBe('http://s/1');
  });

  it('forwards player element events', async () => {
    const c = new PlayerController({ resolve: vi.fn().mockResolvedValue(STREAM) });
    await c.open(CH);
    c.onMediaPlaying();
    expect(c.getState().status).toBe('playing');
    c.onMediaPaused();
    expect(c.getState().status).toBe('paused');
    c.onMediaError('codec');
    expect(c.getState().status).toBe('error');
    expect(c.getState().errorMessage).toBe('codec');
  });

  it('records unique, most-recent-first history', async () => {
    const c = new PlayerController({ resolve: vi.fn().mockResolvedValue(STREAM) });
    const ch2: Channel = { id: 'jf:2', source: 'jellyfin', name: 'CCTV-2' };
    await c.open(CH);
    await c.open(ch2);
    await c.open(CH); // re-open moves to front, no dupes
    expect(c.getState().history.map((h) => h.id)).toEqual(['jf:1', 'jf:2']);
  });

  it('resolve failure lands in error state', async () => {
    const c = new PlayerController({ resolve: vi.fn().mockRejectedValue(new Error('404')) });
    await c.open(CH);
    expect(c.getState().status).toBe('error');
    expect(c.getState().errorMessage).toBe('404');
  });

  it('re-open same channel skips re-resolve', async () => {
    const resolve = vi.fn().mockResolvedValue(STREAM);
    const c = new PlayerController({ resolve });
    await c.open(CH);
    await c.open(CH);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('close resets playback state', async () => {
    const c = new PlayerController({ resolve: vi.fn().mockResolvedValue(STREAM) });
    await c.open(CH);
    c.close();
    expect(c.getState().status).toBe('idle');
    expect(c.getState().channel).toBeNull();
  });
});
