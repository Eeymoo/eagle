/**
 * Player controls controller — pure state machine for custom (self-drawn)
 * player controls. Live TV needs no seek bar; the only behaviors are:
 *
 *  - visibility: shown on demand, auto-hides after a delay (tap video toggles)
 *  - play/pause intent: the head binds `paused` to the video element
 *
 * Timers are injected so tests can run deterministically without waiting.
 */
export interface PlayerControlsDeps {
  /** Auto-hide delay in ms (default 3000). */
  hideDelayMs?: number;
  /** Scheduler injectable for tests (defaults to global setTimeout). */
  schedule?: (fn: () => void, ms: number) => unknown;
  clear?: (handle: unknown) => void;
  /** Fired whenever the user toggles play/pause (optional telemetry). */
  onPlayPause?: (paused: boolean) => void;
}

export interface PlayerControlsState {
  visible: boolean;
  paused: boolean;
  version: number;
}

const DEFAULT_HIDE_DELAY_MS = 3000;

export class PlayerControlsController {
  private deps: Required<Omit<PlayerControlsDeps, 'onPlayPause'>> & {
    onPlayPause?: (paused: boolean) => void;
  };
  private state: PlayerControlsState = { visible: true, paused: false, version: 0 };
  private listeners = new Set<() => void>();
  private snapshot: PlayerControlsState = this.state;
  private hideHandle: unknown = null;

  constructor(deps: PlayerControlsDeps = {}) {
    this.deps = {
      hideDelayMs: deps.hideDelayMs ?? DEFAULT_HIDE_DELAY_MS,
      schedule: deps.schedule ?? ((fn, ms) => setTimeout(fn, ms)),
      clear: deps.clear ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)),
      onPlayPause: deps.onPlayPause,
    };
    this.armAutoHide();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): PlayerControlsState => this.snapshot;

  private set(patch: Partial<PlayerControlsState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    this.snapshot = this.state;
    for (const l of this.listeners) l();
  }

  private armAutoHide(): void {
    if (this.hideHandle !== null) this.deps.clear(this.hideHandle);
    // Paused controls must stay visible so the user can resume.
    if (this.state.paused || !this.state.visible) return;
    this.hideHandle = this.deps.schedule(() => {
      this.hideHandle = null;
      this.set({ visible: false });
    }, this.deps.hideDelayMs);
  }

  /** Show controls and restart the auto-hide timer. */
  show(): void {
    this.set({ visible: true });
    this.armAutoHide();
  }

  hide(): void {
    if (this.hideHandle !== null) {
      this.deps.clear(this.hideHandle);
      this.hideHandle = null;
    }
    this.set({ visible: false });
  }

  /** Video-area tap: toggle visibility. */
  toggle(): void {
    if (this.state.visible) this.hide();
    else this.show();
  }

  /** Play/pause button. Paused state keeps controls visible. */
  togglePlayPause(): void {
    const paused = !this.state.paused;
    this.set({ paused, visible: true });
    if (paused) {
      if (this.hideHandle !== null) {
        this.deps.clear(this.hideHandle);
        this.hideHandle = null;
      }
    } else {
      this.armAutoHide();
    }
    this.deps.onPlayPause?.(paused);
  }
}
