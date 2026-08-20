/**
 * Health controller — behavior for stream-health checking and bad-source
 * filtering. All logic here, heads only render.
 *
 * Design:
 *  - probe(): concurrent HTTP reachability checks for channel stream URLs,
 *    results cached per (channelId, url) with a TTL so refreshes are cheap.
 *  - markBad(): called on playback failure — the channel is penalized
 *    immediately without a network round-trip.
 *  - filter(): health-aware channel filtering. Hide = bad channels are
 *    excluded unless includeBad is true.
 *  - checkOnRefresh is persisted via the settings store (key
 *    `health.checkOnRefresh`, default true).
 */
import type { Channel, Port, StreamUrl } from '@eagle/core';

export interface HealthControllerDeps {
  port: Port;
  /** Resolve a channel's playable stream URL (usually core.resolveStream). */
  resolveStream: (channelId: string) => Promise<StreamUrl>;
  settings: {
    get<T>(key: string, fallback: T): Promise<T>;
    set(key: string, value: unknown): Promise<void>;
  };
}

export type HealthStatus = 'unknown' | 'checking' | 'ok' | 'bad';

export interface HealthState {
  /** channelId → last known status. */
  statuses: Readonly<Record<string, HealthStatus>>;
  /** channelId → probe failure count (bad only after threshold). */
  failures: Readonly<Record<string, number>>;
  /** Number of channels currently being probed. */
  inflight: number;
  /** Whether refresh-time checking is enabled (persisted). */
  checkOnRefresh: boolean;
  /** Whether the list currently hides bad channels (persisted). */
  hideBad: boolean;
  version: number;
}

const BAD_THRESHOLD = 1;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min: don't re-probe healthy channels
const PROBE_TIMEOUT_MS = 8_000;
const CONCURRENCY = 24;

export class HealthController {
  private deps: HealthControllerDeps;
  private state: HealthState = {
    statuses: {},
    failures: {},
    inflight: 0,
    checkOnRefresh: true,
    hideBad: true,
    version: 0,
  };
  private listeners = new Set<() => void>();
  private snapshot: HealthState = this.state;
  /** channelId → { url, at, result } cache. */
  private cache = new Map<string, { url: string; at: number; ok: boolean }>();

  constructor(deps: HealthControllerDeps) {
    this.deps = deps;
    void this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const checkOnRefresh = await this.deps.settings.get('health.checkOnRefresh', true);
    const hideBad = await this.deps.settings.get('health.hideBad', true);
    this.set({ checkOnRefresh, hideBad });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): HealthState => this.snapshot;

  private set(patch: Partial<HealthState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    this.snapshot = this.state;
    for (const l of this.listeners) l();
  }

  async setCheckOnRefresh(on: boolean): Promise<void> {
    await this.deps.settings.set('health.checkOnRefresh', on);
    this.set({ checkOnRefresh: on });
  }

  async setHideBad(on: boolean): Promise<void> {
    await this.deps.settings.set('health.hideBad', on);
    this.set({ hideBad: on });
  }

  /** A channel is "bad" if it reached the failure threshold. */
  isBad(channelId: string): boolean {
    return this.state.statuses[channelId] === 'bad';
  }

  /** Health-aware filter applied by the channel-list head. */
  filter(channels: Channel[]): Channel[] {
    if (!this.state.hideBad) return channels;
    return channels.filter((c) => !this.isBad(c.id));
  }

  /** Playback failed: penalize immediately, no network round-trip. */
  markBad(channelId: string): void {
    if (this.state.statuses[channelId] === 'bad') return;
    const failures = { ...this.state.failures, [channelId]: (this.state.failures[channelId] ?? 0) + 1 };
    if ((failures[channelId] ?? 0) >= BAD_THRESHOLD) {
      this.set({ statuses: { ...this.state.statuses, [channelId]: 'bad' }, failures });
    } else {
      this.set({ failures });
    }
  }

  /** Playback succeeded: clear any penalty and cache as healthy. */
  markOk(channelId: string): void {
    if (this.state.statuses[channelId] === 'ok' && !this.state.failures[channelId]) return;
    const failures = { ...this.state.failures };
    delete failures[channelId];
    const statuses = { ...this.state.statuses, [channelId]: 'ok' as HealthStatus };
    this.set({ statuses, failures });
  }

  /**
   * Probe channels concurrently with a bounded pool. Skips cached-fresh
   * results and channels already known bad (until forget()).
   * Returns the number of newly-detected bad channels.
   */
  async probe(channels: Channel[]): Promise<number> {
    const now = this.deps.port.now();
    const todo: Channel[] = [];
    for (const c of channels) {
      const cached = this.cache.get(c.id);
      if (cached && cached.ok && now - cached.at < CACHE_TTL_MS) continue; // fresh healthy
      if (this.isBad(c.id)) continue; // already bad
      todo.push(c);
    }
    if (todo.length === 0) return 0;

    const statuses = { ...this.state.statuses };
    const failures = { ...this.state.failures };
    for (const c of todo) statuses[c.id] = 'checking';
    this.set({ statuses, inflight: todo.length });

    let newlyBad = 0;
    let index = 0;
    const worker = async (): Promise<void> => {
      while (index < todo.length) {
        const channel = todo[index++]!;
        const ok = await this.probeOne(channel);
        if (ok) {
          statuses[channel.id] = 'ok';
          delete failures[channel.id];
        } else {
          failures[channel.id] = (failures[channel.id] ?? 0) + 1;
          if ((failures[channel.id] ?? 0) >= BAD_THRESHOLD) {
            statuses[channel.id] = 'bad';
            newlyBad++;
          } else {
            statuses[channel.id] = 'unknown';
          }
        }
        this.set({ statuses: { ...statuses }, failures: { ...failures } });
      }
    };
    const workers = Array.from({ length: Math.min(CONCURRENCY, todo.length) }, () => worker());
    await Promise.all(workers);
    this.set({ inflight: 0 });
    return newlyBad;
  }

  /** HEAD (fallback short GET) reachability check on the resolved stream URL. */
  private async probeOne(channel: Channel): Promise<boolean> {
    try {
      const stream = await this.deps.resolveStream(channel.id);
      const ok = await this.reach(stream.url);
      const now = this.deps.port.now();
      this.cache.set(channel.id, { url: stream.url, at: now, ok });
      return ok;
    } catch {
      return false;
    }
  }

  private async reach(url: string): Promise<boolean> {
    // Try HEAD; some IPTV servers reject HEAD → retry with a 1-byte-ish GET.
    for (const method of ['HEAD', 'GET'] as const) {
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), PROBE_TIMEOUT_MS);
        let res: Response;
        try {
          res = await fetch(url, {
            method,
            signal: ac.signal,
            headers: method === 'GET' ? { Range: 'bytes=0-1024' } : undefined,
          });
        } finally {
          clearTimeout(timer);
        }
        if (res.ok || res.status === 206 || res.status === 302 || res.status === 301) return true;
        if (res.status >= 400 && res.status < 500 && method === 'GET') return false;
      } catch {
        // network error → try GET
      }
    }
    return false;
  }

  /** Clear all health data (e.g. user-triggered re-check). */
  forget(): void {
    this.cache.clear();
    this.set({ statuses: {}, failures: {} });
  }
}
