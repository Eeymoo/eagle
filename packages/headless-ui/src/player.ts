/**
 * Player controller — behavior around playback: resolve stream URL, expose
 * lifecycle transitions, surface errors. Rendering (Video element / <video>)
 * stays entirely in the head; this owns the state machine around it.
 */
import type { Channel, StreamUrl } from '@eagle/core';

export type PlayerStatus =
  | 'idle'
  | 'resolving' // fetching playable URL
  | 'loading-media' // URL ready, player buffering
  | 'playing'
  | 'paused'
  | 'error';

export interface PlayerState {
  status: PlayerStatus;
  channel: Channel | null;
  stream: StreamUrl | null;
  errorMessage: string | null;
  /** Recent history for "up next" / quick switch (bounded). */
  history: Channel[];
  version: number;
}

export interface PlayerControllerDeps {
  resolve: (channelId: string) => Promise<StreamUrl>;
}

const HISTORY_LIMIT = 20;

export class PlayerController {
  private state: PlayerState = {
    status: 'idle',
    channel: null,
    stream: null,
    errorMessage: null,
    history: [],
    version: 0,
  };
  private listeners = new Set<() => void>();
  private deps: PlayerControllerDeps;

  constructor(deps: PlayerControllerDeps) {
    this.deps = deps;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): PlayerState => this.state;

  private set(patch: Partial<PlayerState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    for (const l of this.listeners) l();
  }

  /** Open a channel: resolve URL, transition resolving → loading-media. */
  async open(channel: Channel): Promise<void> {
    if (this.state.channel?.id === channel.id && this.state.stream) {
      this.set({ status: 'loading-media' }); // re-open same channel
      return;
    }
    this.set({ status: 'resolving', channel, stream: null, errorMessage: null });
    try {
      const stream = await this.deps.resolve(channel.id);
      this.pushHistory(channel);
      this.set({ status: 'loading-media', stream });
    } catch (e) {
      this.set({
        status: 'error',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /* Player-element events (the head forwards these up). */
  onMediaLoading(): void {
    this.set({ status: 'loading-media' });
  }
  onMediaPlaying(): void {
    this.set({ status: 'playing' });
  }
  onMediaPaused(): void {
    this.set({ status: 'paused' });
  }
  onMediaError(message: string): void {
    this.set({ status: 'error', errorMessage: message });
  }

  close(): void {
    this.set({ status: 'idle', channel: null, stream: null, errorMessage: null });
  }

  private pushHistory(channel: Channel): void {
    const history = [channel, ...this.state.history.filter((c) => c.id !== channel.id)];
    this.state = { ...this.state, history: history.slice(0, HISTORY_LIMIT) };
  }
}
