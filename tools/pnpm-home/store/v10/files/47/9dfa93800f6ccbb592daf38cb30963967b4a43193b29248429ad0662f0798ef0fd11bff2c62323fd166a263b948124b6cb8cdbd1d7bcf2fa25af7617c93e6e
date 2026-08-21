/**
 * Global error bus used by {@link GlobalErrorBoundary} to receive errors that
 * are captured outside the React render tree (e.g. `ErrorUtils` fatals,
 * unhandled promise rejections).
 *
 * The bus is intentionally tiny and stored on the global object so that it
 * survives Fast Refresh during development.
 *
 * This module is internal to the SDK.
 */
/** Where the error came from. */
export type GlobalErrorKind = 'onerror' | 'onunhandledrejection';
/** Payload delivered to subscribers. */
export interface GlobalErrorEvent {
    error: unknown;
    isFatal: boolean;
    kind: GlobalErrorKind;
    /**
     * Sentry event id assigned when the integration captured this error.
     * Threaded through to subscribers so the fallback UI can show the exact
     * id without racing against unrelated `captureException` calls happening
     * elsewhere in the app via `lastEventId()`.
     */
    eventId?: string;
}
/** Options describing which kinds of errors a subscriber wants. */
export interface GlobalErrorSubscriberOptions {
    /** Receive fatal `ErrorUtils` errors. Defaults to true. */
    fatal?: boolean;
    /** Receive non-fatal `ErrorUtils` errors. Defaults to false. */
    nonFatal?: boolean;
    /** Receive unhandled promise rejections. Defaults to false. */
    unhandledRejection?: boolean;
}
type Listener = (event: GlobalErrorEvent) => void;
/**
 * Subscribe to global errors. Returns an unsubscribe function.
 */
export declare function subscribeGlobalError(listener: Listener, options?: GlobalErrorSubscriberOptions): () => void;
/**
 * Returns true if at least one subscriber is interested in the given event.
 *
 * Used by the error handlers integration to decide whether to skip invoking
 * React Native's default error handler (which would otherwise tear down the
 * JS context and prevent any fallback UI from rendering).
 */
export declare function hasInterestedSubscribers(kind: GlobalErrorKind, isFatal: boolean): boolean;
/**
 * Publish a global error to all interested subscribers. Each listener runs
 * isolated in try/catch so a misbehaving subscriber cannot interrupt others
 * or unwind into the caller (the error handlers integration depends on
 * publish never throwing so its `handlingFatal` latch is always released).
 */
export declare function publishGlobalError(event: GlobalErrorEvent): void;
/** Test-only: clear all subscribers. */
export declare function _resetGlobalErrorBus(): void;
export {};
//# sourceMappingURL=globalErrorBus.d.ts.map
