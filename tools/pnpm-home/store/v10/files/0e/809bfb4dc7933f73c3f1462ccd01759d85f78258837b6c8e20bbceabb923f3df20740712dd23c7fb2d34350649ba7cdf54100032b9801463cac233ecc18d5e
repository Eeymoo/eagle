import type { Integration, Span } from '@sentry/core';
/**
 * Describes the state machine context from `expo-updates`.
 * We define our own minimal type to avoid a hard dependency on `expo-updates`.
 */
interface UpdatesNativeStateMachineContext {
    isChecking: boolean;
    isDownloading: boolean;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isRestarting: boolean;
    latestManifest?: {
        id?: string;
    };
    downloadedManifest?: {
        id?: string;
    };
    rollback?: {
        commitTime: string;
    };
    checkError?: Error;
    downloadError?: Error;
}
/**
 * Listens to Expo Updates native state machine changes and records
 * breadcrumbs and spans for meaningful transitions such as checking
 * for updates, downloading updates, errors, rollbacks, and restarts.
 */
export declare const expoUpdatesListenerIntegration: () => Integration;
/**
 * Manages span lifecycle for check and download operations.
 * Starts spans when operations begin, ends them when they complete or fail.
 *
 * @internal Exposed for testing purposes
 */
export declare function handleSpanLifecycle(previous: Partial<UpdatesNativeStateMachineContext>, current: UpdatesNativeStateMachineContext, currentCheckSpan: Span | undefined, currentDownloadSpan: Span | undefined): {
    checkSpan: Span | undefined;
    downloadSpan: Span | undefined;
};
/**
 * Compares previous and current state machine contexts and emits
 * breadcrumbs for meaningful transitions (falsy→truthy).
 *
 * @internal Exposed for testing purposes
 */
export declare function handleStateChange(previous: Partial<UpdatesNativeStateMachineContext>, current: UpdatesNativeStateMachineContext): void;
export {};
//# sourceMappingURL=expoupdateslistener.d.ts.map
