/**
 * Sources controller — behavior for the "configured sources" list:
 * read, remove, react to registry changes. Head renders; this owns state.
 */
import type { SourceRef } from '@eagle/core';

export interface SourcesControllerDeps {
  list: () => SourceRef[];
  remove: (id: string) => Promise<void>;
  /** Registry change signal (usually core.subscribe). */
  subscribe: (listener: () => void) => () => void;
}

export class SourcesController {
  private sources: SourceRef[] = [];
  private version = 0;
  private listeners = new Set<() => void>();
  private deps: SourcesControllerDeps;
  /**
   * Cached snapshot — CRITICAL: useSyncExternalStore requires getSnapshot to
   * return a reference-stable value between mutations. Returning a fresh
   * object literal per call sends React into an infinite re-render loop
   * ("Maximum update depth exceeded" → crash on opening the settings screen).
   */
  private snapshot: { sources: SourceRef[]; version: number } = { sources: [], version: 0 };

  constructor(deps: SourcesControllerDeps) {
    this.deps = deps;
    this.deps.subscribe(() => this.refresh());
    this.refresh();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): { sources: SourceRef[]; version: number } => this.snapshot;

  refresh(): void {
    this.sources = this.deps.list();
    this.version++;
    this.snapshot = { sources: this.sources, version: this.version };
    for (const l of this.listeners) l();
  }

  async remove(id: string): Promise<void> {
    await this.deps.remove(id);
    // registry change signal triggers refresh(); also refresh defensively.
    this.refresh();
  }
}
