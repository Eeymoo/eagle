/**
 * Watch-progress bookkeeping for VOD playback (断点续播 / 继续观看).
 * Pure state + persistence; heads render it. Positions are recorded from
 * the player, persisted to the settings store, and surfaced as a
 * "continue watching" queue ordered by recency.
 */

export interface WatchProgressEntry {
  channelId: string;
  /** Display helpers so cards render without a channel-list lookup. */
  name: string;
  posterUrl?: string;
  positionSec: number;
  durationSec: number;
  updatedAt: number;
}

export interface WatchProgressState {
  /** channelId → entry. Version bumps on every mutation. */
  entries: Record<string, WatchProgressEntry>;
  version: number;
}

export interface WatchProgressDeps {
  get: <T>(key: string, fallback: T) => Promise<T>;
  set: <T>(key: string, value: T) => Promise<void>;
  now?: () => number;
}

const KEY = 'eagle.watchprogress';
/** Progress window that qualifies for "continue watching". */
const MIN_RATIO = 0.05;
const MAX_RATIO = 0.95;
/** Keep at most this many entries (LRU by updatedAt). */
const MAX_ENTRIES = 60;

export class WatchProgressController {
  private listeners = new Set<() => void>();
  private state: WatchProgressState = { entries: {}, version: 0 };
  private loaded = false;

  constructor(private readonly deps: WatchProgressDeps) {
    void this.load();
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const stored = await this.deps.get<Record<string, WatchProgressEntry>>(KEY, {});
      this.state = { entries: stored ?? {}, version: this.state.version + 1 };
      this.emit();
    } catch {
      // Corrupt store → start empty.
    }
    this.loaded = true;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): WatchProgressState => this.state;

  /** Record playback progress (player calls this periodically). */
  record(channelId: string, meta: { name: string; posterUrl?: string }, positionSec: number, durationSec: number): void {
    if (!channelId || !Number.isFinite(positionSec) || !Number.isFinite(durationSec) || durationSec <= 0) return;
    const ratio = positionSec / durationSec;
    const prev = this.state.entries[channelId];
    // Finished (≥95%) → drop from continue watching.
    if (ratio >= MAX_RATIO) {
      if (!prev) return;
      const entries = { ...this.state.entries };
      delete entries[channelId];
      this.state = { entries, version: this.state.version + 1 };
      void this.persist();
      this.emit();
      return;
    }
    // Skip noise: barely started, or backwards/forwards blips under 3s.
    if (ratio < MIN_RATIO) return;
    if (prev && Math.abs(positionSec - prev.positionSec) < 3) return;
    const entry: WatchProgressEntry = {
      channelId,
      name: meta.name,
      posterUrl: meta.posterUrl,
      positionSec,
      durationSec,
      updatedAt: this.deps.now?.() ?? Date.now(),
    };
    this.state = {
      entries: { ...this.state.entries, [channelId]: entry },
      version: this.state.version + 1,
    };
    this.trim();
    void this.persist();
    this.emit();
  }

  remove(channelId: string): void {
    if (!this.state.entries[channelId]) return;
    const entries = { ...this.state.entries };
    delete entries[channelId];
    this.state = { entries, version: this.state.version + 1 };
    void this.persist();
    this.emit();
  }

  /** Resume position for a channel (0 when none / finished). */
  resumeFor(channelId: string): number {
    return this.state.entries[channelId]?.positionSec ?? 0;
  }

  /** Continue-watching queue, most recent first. */
  continueWatching(limit = 12): WatchProgressEntry[] {
    return Object.values(this.state.entries)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  private trim(): void {
    const all = Object.values(this.state.entries).sort((a, b) => b.updatedAt - a.updatedAt);
    if (all.length <= MAX_ENTRIES) return;
    const keep = new Map(all.slice(0, MAX_ENTRIES).map((e) => [e.channelId, e]));
    this.state = {
      entries: Object.fromEntries(keep),
      version: this.state.version + 1,
    };
  }

  private async persist(): Promise<void> {
    try {
      await this.deps.set(KEY, this.state.entries);
    } catch {
      // Storage full/unavailable — in-memory progress still works.
    }
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}
