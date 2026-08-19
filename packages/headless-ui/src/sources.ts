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

  constructor(deps: SourcesControllerDeps) {
    this.deps = deps;
    this.deps.subscribe(() => this.refresh());
    this.refresh();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): { sources: SourceRef[]; version: number } => ({
    sources: this.sources,
    version: this.version,
  });

  refresh(): void {
    this.sources = this.deps.list();
    this.version++;
    for (const l of this.listeners) l();
  }

  async remove(id: string): Promise<void> {
    await this.deps.remove(id);
    // registry change signal triggers refresh(); also refresh defensively.
    this.refresh();
  }
}
