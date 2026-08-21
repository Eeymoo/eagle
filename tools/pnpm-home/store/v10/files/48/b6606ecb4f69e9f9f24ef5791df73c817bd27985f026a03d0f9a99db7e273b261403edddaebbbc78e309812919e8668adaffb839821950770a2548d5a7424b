import type { Scope, Span } from '@sentry/core';
import * as React from 'react';
import type { ReactNativeOptions, ReactNativeWrapperOptions } from './options';
/**
 * Inits the SDK and returns the final options.
 */
export declare function init(passedOptions: ReactNativeOptions): void;
/**
 * Inits the Sentry React Native SDK with automatic instrumentation and wrapped features.
 */
export declare function wrap<P extends Record<string, unknown>>(RootComponent: React.ComponentType<P>, options?: ReactNativeWrapperOptions): React.ComponentType<P>;
/**
 * If native client is available it will trigger a native crash.
 * Use this only for testing purposes.
 */
export declare function nativeCrash(): void;
/**
 * Signals that the application has finished loading and is ready for user interaction.
 *
 * Call this when your app is truly ready — after async initialization, data loading,
 * splash screen dismissal, auth session restore, etc. This marks the end of the app start span,
 * giving you a more accurate measurement of perceived startup time.
 *
 * If not called, the SDK falls back to the root component mount time (via `Sentry.wrap()`)
 * or JS bundle execution start.
 *
 * @experimental This API is subject to change in future versions.
 *
 * @example
 * ```ts
 * await loadRemoteConfig();
 * await restoreSession();
 * SplashScreen.hide();
 * Sentry.appLoaded();
 * ```
 */
export declare function appLoaded(): void;
/**
 * Extends the app start window so work done after initialization (remote config, session restore,
 * splash screen dismissal, etc.) is included in the app start measurement. Call
 * {@link finishExtendedAppStart} when the app is ready, or attach child spans via
 * {@link getExtendedAppStartSpan} to break the extended work down.
 *
 * Requires standalone app start tracing (`_experiments.enableStandaloneAppStartTracing`). No-ops if
 * the app start transaction was already created, if extend was already called, or if called before
 * `Sentry.init()`.
 *
 * @experimental This API is subject to change in future versions.
 *
 * @example
 * ```ts
 * Sentry.extendAppStart();
 * await initializeRemoteConfig();
 * Sentry.finishExtendedAppStart();
 * ```
 */
export declare function extendAppStart(): void;
/**
 * Returns the extended app start span for attaching child spans, or a no-op span when there is no
 * active extension. Only meaningful between {@link extendAppStart} and {@link finishExtendedAppStart}.
 *
 * @experimental This API is subject to change in future versions.
 *
 * @example
 * ```ts
 * Sentry.extendAppStart();
 * const parentSpan = Sentry.getExtendedAppStartSpan();
 * const child = Sentry.startInactiveSpan({ parentSpan, op: 'app.init', name: 'fetch remote config' });
 * await loadRemoteConfig();
 * child.end();
 * Sentry.finishExtendedAppStart();
 * ```
 */
export declare function getExtendedAppStartSpan(): Span;
/**
 * Finishes the app start extension started with {@link extendAppStart}, finalizing the app start
 * transaction (its duration is trimmed to the last child span). No-ops if there is no active
 * extension.
 *
 * Returns a promise that resolves once the app start transaction has been captured. `await` it
 * before {@link flush} (e.g. before a code-push/expo update) to make sure the app start data is
 * queued.
 *
 * @experimental This API is subject to change in future versions.
 */
export declare function finishExtendedAppStart(): Promise<void>;
/**
 * Flushes all pending events in the queue to disk.
 * Use this before applying any realtime updates such as code-push or expo updates.
 */
export declare function flush(): Promise<boolean>;
/**
 * Closes the SDK, stops sending events.
 */
export declare function close(): Promise<void>;
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
export declare function withScope<T>(callback: (scope: Scope) => T): T | undefined;
/**
 * Returns if the app crashed in the last run.
 */
export declare function crashedLastRun(): Promise<boolean | null>;
/**
 * Pauses app hang tracking on iOS.
 *
 * App hang detection will ignore detected app hangs until
 * `resumeAppHangTracking` is called.
 *
 * Use this when showing system dialogs (e.g., permission prompts)
 * that block the main thread but are not real hangs.
 *
 * No-op on Android and when native is not available.
 *
 * @platform ios
 */
export declare function pauseAppHangTracking(): void;
/**
 * Resumes app hang tracking on iOS after it was paused.
 *
 * No-op on Android and when native is not available.
 *
 * @platform ios
 */
export declare function resumeAppHangTracking(): void;
//# sourceMappingURL=sdk.d.ts.map