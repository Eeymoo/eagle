/**
 * Media-library browsing controller: Jellyfin-style modular home
 * (我的媒体 / 最近添加). Sources expose the capability via LibrarySource;
 * this controller finds the first capable source and loads the shelves.
 */

import type { MediaLibrary, LibraryItem } from '@eagle/core';

export type LibraryStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LibraryState {
  status: LibraryStatus;
  /** null when no media-library source is configured (live-only setup). */
  available: boolean;
  libraries: MediaLibrary[];
  recent: LibraryItem[];
  errorMessage?: string;
  version: number;
}

export interface LibraryControllerDeps {
  /** Capable sources (implementsLibrary already checked by the caller). */
  loadLibraries: () => Promise<MediaLibrary[] | null>;
  loadRecent: (limit: number) => Promise<LibraryItem[] | null>;
  loadItems: (viewId: string) => Promise<LibraryItem[]>;
  loadEpisodes: (seriesId: string) => Promise<LibraryItem[]>;
}

export class LibraryController {
  private listeners = new Set<() => void>();
  private state: LibraryState = {
    status: 'idle',
    available: false,
    libraries: [],
    recent: [],
    version: 0,
  };

  constructor(private readonly deps: LibraryControllerDeps) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): LibraryState => this.state;

  private set(patch: Partial<LibraryState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    for (const l of this.listeners) l();
  }

  /** Load (or reload) the shelves. Idempotent; safe to call on mount. */
  async refresh(): Promise<void> {
    this.set({ status: 'loading' });
    try {
      const libraries = await this.deps.loadLibraries();
      if (!libraries) {
        this.set({ status: 'ready', available: false, libraries: [], recent: [] });
        return;
      }
      const recent = (await this.deps.loadRecent(20).catch(() => [])) ?? [];
      this.set({ status: 'ready', available: true, libraries, recent });
    } catch (e) {
      this.set({
        status: 'error',
        available: true,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /** Items of one library (poster wall). Not stateful — callers own paging. */
  loadItems(viewId: string): Promise<LibraryItem[]> {
    return this.deps.loadItems(viewId);
  }

  /** Episodes of one series, season/episode ordered. */
  loadEpisodes(seriesId: string): Promise<LibraryItem[]> {
    return this.deps.loadEpisodes(seriesId);
  }
}
