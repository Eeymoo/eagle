/**
 * ChannelList controller — the complete behavior/state machine for a
 * channel list, with zero rendering and zero styling.
 *
 * Pattern (headless): the controller owns state + transitions; a head
 * (rn-ui-plugin / tauri-ui-plugin) subscribes and renders. Controllers are
 * plain classes — testable without React, usable with any renderer.
 */
import type { Channel } from '@eagle/core';

export type ChannelListStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ChannelListState {
  status: ChannelListStatus;
  channels: Channel[];
  /** Client-side filter text (normalized lowercase). */
  query: string;
  /** Active group filter; null = all. */
  group: string | null;
  errorMessage: string | null;
  /** Monotonic version — external stores use it as change signal. */
  version: number;
}

export interface ChannelListControllerDeps {
  /** Fetch the merged channel list (usually EagleCore.listChannels). */
  load: () => Promise<Channel[]>;
  /** Optional persistence for query/group between sessions. */
  persist?: { save(state: { query: string; group: string | null }): void };
}

export class ChannelListController {
  private state: ChannelListState = {
    status: 'idle',
    channels: [],
    query: '',
    group: null,
    errorMessage: null,
    version: 0,
  };
  private listeners = new Set<() => void>();
  private deps: ChannelListControllerDeps;

  constructor(deps: ChannelListControllerDeps) {
    this.deps = deps;
  }

  /* ---------- store interop (useSyncExternalStore shape) ---------- */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): ChannelListState => this.state;

  private set(patch: Partial<ChannelListState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    for (const l of this.listeners) l();
  }

  /* ---------- transitions ---------- */

  async refresh(force = false): Promise<void> {
    if (this.state.status === 'loading') return; // no concurrent loads
    this.set({ status: 'loading', errorMessage: null });
    try {
      const channels = await this.deps.load();
      this.set({ status: 'ready', channels });
    } catch (e) {
      this.set({
        status: 'error',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
    void force;
  }

  setQuery(query: string): void {
    this.set({ query });
    this.deps.persist?.save({ query, group: this.state.group });
  }

  setGroup(group: string | null): void {
    this.set({ group });
    this.deps.persist?.save({ query: this.state.query, group });
  }

  /* ---------- derived selectors (pure) ---------- */

  /** All distinct groups, sorted, count attached. */
  groups(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const c of this.state.channels) {
      const key = c.group ?? '其他';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /** Query + group filtered channels. */
  visibleChannels(): Channel[] {
    const { channels, query, group } = this.state;
    const q = query.trim().toLowerCase();
    return channels.filter((c) => {
      if (group !== null && (c.group ?? '其他') !== group) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }
}
