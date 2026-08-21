import type { Breadcrumb, Scope } from '@sentry/core';
/**
 * Mark a breadcrumb so that adding it to a synced scope does **not** forward it
 * to the native SDKs. The caller becomes responsible for calling
 * `syncBreadcrumbToNative` once its data is complete.
 *
 * This exists for breadcrumbs that carry data which can only be resolved
 * asynchronously (see the Mobile Replay network body capture): the breadcrumb
 * still reaches the JavaScript scope synchronously — so error events captured in
 * the meantime keep it — while the native SDKs, which cannot update a breadcrumb
 * after the fact, receive it once and already enriched.
 *
 * The mark is consumed by the first synced scope the breadcrumb is added to.
 */
export declare function deferBreadcrumbNativeSync(breadcrumb: Breadcrumb): void;
/**
 * Forward a breadcrumb to the native SDKs without adding it to a scope. Used to
 * complete a `deferBreadcrumbNativeSync` handover.
 */
export declare function syncBreadcrumbToNative(breadcrumb: Breadcrumb): void;
/**
 * Hooks into the scope set methods and sync new data added to the given scope with the native SDKs.
 */
export declare function enableSyncToNative(scope: Scope): void;
//# sourceMappingURL=scopeSync.d.ts.map
