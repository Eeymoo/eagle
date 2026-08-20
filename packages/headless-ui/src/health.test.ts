/**
 * Health controller behavior: probe caching, bad-marking, filtering,
 * persistence of the two settings flags.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HealthController } from './health.js';
import type { Channel, Port } from '@eagle/core';

function fakePort(): Port {
  return {
    getText: vi.fn(),
    getJson: vi.fn(),
    now: vi.fn(() => 1_000_000),
    hash: (s: string) => `h(${s})`,
  };
}

function ch(id: string): Channel {
  return { id, name: id, source: 'm3u' } as Channel;
}

/** Global fetch stub: okUrls resolve, others throw. */
function stubFetch(okUrls: Set<string>) {
  const impl = async (url: string) => {
    if (okUrls.has(url)) return { ok: true, status: 200 } as Response;
    throw new TypeError('network fail');
  };
  vi.stubGlobal('fetch', vi.fn(impl));
}

function makeController(opts?: { resolveFail?: Set<string> }) {
  const port = fakePort();
  const store = new Map<string, unknown>();
  const resolveStream = vi.fn(async (id: string): Promise<import('@eagle/core').StreamUrl> => {
    if (opts?.resolveFail?.has(id)) throw new Error('unresolvable');
    return { url: `http://x/${id}`, kind: 'm3u' };
  });
  const health = new HealthController({
    port,
    resolveStream,
    settings: {
      get: async <T,>(k: string, fb: T) => (store.has(k) ? (store.get(k) as T) : fb),
      set: async (k: string, v: unknown) => {
        store.set(k, v);
      },
    },
  });
  return { health, store, resolveStream };
}

describe('HealthController', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks unreachable channels bad and filters them', async () => {
    stubFetch(new Set(['http://x/good']));
    const { health } = makeController();
    await health.probe([ch('good'), ch('dead')]);
    expect(health.isBad('dead')).toBe(true);
    expect(health.isBad('good')).toBe(false);
    expect(health.filter([ch('good'), ch('dead')])).toEqual([ch('good')]);
  });

  it('markBad on playback failure hides without probing', () => {
    stubFetch(new Set());
    const { health } = makeController();
    health.markBad('c1');
    expect(health.isBad('c1')).toBe(true);
    expect(health.filter([ch('c1')])).toEqual([]);
  });

  it('markOk clears a bad mark', () => {
    stubFetch(new Set());
    const { health } = makeController();
    health.markBad('c1');
    health.markOk('c1');
    expect(health.isBad('c1')).toBe(false);
  });

  it('does not re-probe healthy channels within TTL', async () => {
    stubFetch(new Set(['http://x/good']));
    const { health, resolveStream } = makeController();
    await health.probe([ch('good')]);
    await health.probe([ch('good')]);
    expect(resolveStream).toHaveBeenCalledTimes(1); // cached second time
  });

  it('unresolvable channels are bad', async () => {
    stubFetch(new Set());
    const { health } = makeController({ resolveFail: new Set(['broken']) });
    await health.probe([ch('broken')]);
    expect(health.isBad('broken')).toBe(true);
  });

  it('persists settings flags and disables filtering when hideBad=false', async () => {
    stubFetch(new Set());
    const { health, store } = makeController();
    await health.setHideBad(false);
    await health.setCheckOnRefresh(false);
    expect(store.get('health.hideBad')).toBe(false);
    expect(store.get('health.checkOnRefresh')).toBe(false);
    health.markBad('c1');
    expect(health.filter([ch('c1')])).toEqual([ch('c1')]); // not hidden now
  });

  it('forget() resets all health state so channels re-probe', async () => {
    stubFetch(new Set(['http://x/good']));
    const { health, resolveStream } = makeController();
    await health.probe([ch('good')]);
    health.forget();
    await health.probe([ch('good')]);
    expect(resolveStream).toHaveBeenCalledTimes(2);
  });
});
