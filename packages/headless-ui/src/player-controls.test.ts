/**
 * PlayerControlsController behavior: tap-toggle visibility, auto-hide timer
 * with injected scheduler, pause keeps controls visible.
 */
import { describe, expect, it, vi } from 'vitest';
import { PlayerControlsController } from './player-controls.js';

function makeController(hideDelayMs = 3000) {
  const fired: Array<() => void> = [];
  const handles = new Set<unknown>();
  const controls = new PlayerControlsController({
    hideDelayMs,
    schedule: (fn) => {
      const h = { fn };
      handles.add(h);
      return h;
    },
    clear: (h) => handles.delete(h),
    onPlayPause: vi.fn(),
  });
  return {
    controls,
    tick: () => {
      const pending = [...handles];
      handles.clear();
      for (const h of pending) (h as { fn: () => void }).fn();
    },
    pending: () => handles.size,
  };
}

describe('PlayerControlsController', () => {
  it('auto-hides after the delay', () => {
    const { controls, tick } = makeController();
    expect(controls.getState().visible).toBe(true);
    tick();
    expect(controls.getState().visible).toBe(false);
  });

  it('show() restarts the timer', () => {
    const { controls, tick, pending } = makeController();
    controls.show();
    expect(pending()).toBe(1);
    tick();
    expect(controls.getState().visible).toBe(false);
    controls.show();
    expect(controls.getState().visible).toBe(true);
  });

  it('toggle() flips visibility and manages the timer', () => {
    const { controls, tick, pending } = makeController();
    controls.toggle(); // visible -> hidden, timer cleared
    expect(controls.getState().visible).toBe(false);
    expect(pending()).toBe(0);
    controls.toggle(); // hidden -> shown, timer armed
    expect(controls.getState().visible).toBe(true);
    expect(pending()).toBe(1);
    tick();
    expect(controls.getState().visible).toBe(false);
  });

  it('pause keeps controls visible and does not auto-hide', () => {
    const { controls, tick, pending } = makeController();
    controls.togglePlayPause();
    expect(controls.getState().paused).toBe(true);
    expect(controls.getState().visible).toBe(true);
    expect(pending()).toBe(0);
    tick(); // nothing scheduled — still visible
    expect(controls.getState().visible).toBe(true);
  });

  it('resume re-arms auto-hide', () => {
    const { controls, tick, pending } = makeController();
    controls.togglePlayPause(); // paused
    controls.togglePlayPause(); // resumed
    expect(controls.getState().paused).toBe(false);
    expect(pending()).toBe(1);
    tick();
    expect(controls.getState().visible).toBe(false);
  });
});
