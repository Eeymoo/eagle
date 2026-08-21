import type { Integration } from '@sentry/core';
/**
 * Adds `debug_meta.images` to error events based on the Debug ID injected by
 * Metro (`_sentryDebugIds`).
 *
 * React Native (Hermes) ships a single JS bundle per platform with a canonical
 * `code_file` (`app:///index.android.bundle` / `app:///main.jsbundle`). This
 * makes the direct Debug ID lookup used by profiling (`getDebugMetadata`) safe
 * to reuse for all error events.
 *
 * The core `prepareEvent` pipeline already attempts this via `applyDebugIds` ->
 * `applyDebugMeta`, but that path re-parses the premodule `Error().stack` and
 * requires an exact filename match against the exception frames, which is
 * fragile for Hermes premodule stacks. When it fails, events ship without
 * `debug_meta` and symbolication falls back to release + filename matching.
 *
 * Ordering matters: core runs `applyDebugIds` (which sets `frame.debug_id`)
 * *before* event processors, and `applyDebugMeta` (which turns those into
 * `debug_meta.images`) *after* them. This integration is an event processor, so
 * to stay idempotent it detects a successful core match via `frame.debug_id`
 * and backs off — otherwise core would append a second, identical image.
 */
export declare const debugMetaIntegration: () => Integration;
//# sourceMappingURL=debugmeta.d.ts.map
