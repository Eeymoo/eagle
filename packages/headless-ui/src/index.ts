/** Public surface of @eagle/headless-ui. */
export { ChannelListController } from './channel-list.js';
export type { ChannelListState, ChannelListStatus, ChannelListControllerDeps } from './channel-list.js';
export { AddSourceFormController } from './add-source-form.js';
export type { AddSourceFormState, AddSourceFormDeps, FormStatus } from './add-source-form.js';
export { PlayerController } from './player.js';
export type { PlayerState, PlayerStatus, PlayerControllerDeps } from './player.js';
export { SourcesController } from './sources.js';
export type { SourcesControllerDeps } from './sources.js';
export { HealthController } from './health.js';
export type { HealthState, HealthStatus, HealthControllerDeps } from './health.js';
export { PlayerControlsController } from './player-controls.js';
export type { PlayerControlsState, PlayerControlsDeps } from './player-controls.js';
export { useChannelList, useAddSourceForm, usePlayer, useSources, useHealth, usePlayerControls } from './hooks.js';
export { createEagleControllers } from './controllers.js';
export type { EagleControllers } from './controllers.js';

export { WatchProgressController } from './watch-progress.js';
export type { WatchProgressEntry, WatchProgressState, WatchProgressDeps } from './watch-progress.js';
export { LibraryController } from './library.js';
export type { LibraryState, LibraryStatus, LibraryControllerDeps } from './library.js';
export { useWatchProgress, useLibrary } from './hooks.js';
