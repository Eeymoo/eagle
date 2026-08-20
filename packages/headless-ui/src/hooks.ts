/**
 * React bindings for headless controllers — thin useSyncExternalStore glue.
 * These hooks contain no rendering and no styling; they exist so any React
 * renderer (RN, web, Tauri) gets identical controller semantics.
 */
import { useSyncExternalStore } from 'react';
import { ChannelListController } from './channel-list.js';
import type { ChannelListState } from './channel-list.js';
import { AddSourceFormController } from './add-source-form.js';
import type { AddSourceFormState } from './add-source-form.js';
import { PlayerController } from './player.js';
import type { PlayerState } from './player.js';
import { SourcesController } from './sources.js';
import { HealthController } from './health.js';
import type { HealthState } from './health.js';
import { PlayerControlsController } from './player-controls.js';
import type { PlayerControlsState } from './player-controls.js';

/** Subscribe to a controller's state with a stable snapshot. */
export function useChannelList(controller: ChannelListController): ChannelListState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

export function useAddSourceForm(controller: AddSourceFormController): AddSourceFormState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

export function usePlayer(controller: PlayerController): PlayerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

export function useSources(controller: SourcesController): { sources: import('@eagle/core').SourceRef[]; version: number } {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

export function useHealth(controller: HealthController): HealthState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

export function usePlayerControls(controller: PlayerControlsController): PlayerControlsState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
