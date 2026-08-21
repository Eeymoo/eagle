import type { Integration, Span } from '@sentry/core';
import type { NativeFramesResponse } from '../../NativeRNSentry';
export type AppStartIntegration = Integration & {
    captureStandaloneAppStart: () => Promise<void>;
    cancelDeferredStandaloneCapture: () => void;
    scheduleDeferredStandaloneCapture: () => void;
    extendAppStart: () => void;
    getExtendedAppStartSpan: () => Span;
    finishExtendedAppStart: () => Promise<void>;
};
interface AppStartEndData {
    timestampMs: number;
    endFrames: NativeFramesResponse | null;
}
/**
 * Records the application start end.
 * Used automatically by `Sentry.wrap` and `Sentry.ReactNativeProfiler`.
 *
 * @deprecated Use {@link appLoaded} from the public SDK API instead (`Sentry.appLoaded()`).
 */
export declare function captureAppStart(): Promise<void>;
/**
 * Signals that the app has finished loading and is ready for user interaction.
 * Called internally by `appLoaded()` from the public SDK API.
 *
 * @private
 */
export declare function _appLoaded(): Promise<void>;
/**
 * For internal use only.
 *
 * @private
 */
export declare function _captureAppStart({ isManual }: {
    isManual: boolean;
}): Promise<void>;
/**
 * Extends the app start window. Called internally by `extendAppStart()` from the public SDK API.
 *
 * @private
 */
export declare function _extendAppStart(): void;
/**
 * Returns the extended app start span (a no-op span when there's no active extension).
 * Called internally by `getExtendedAppStartSpan()` from the public SDK API.
 *
 * @private
 */
export declare function _getExtendedAppStartSpan(): Span;
/**
 * Finishes the extended app start. Called internally by `finishExtendedAppStart()` from the public
 * SDK API.
 *
 * @private
 */
export declare function _finishExtendedAppStart(): Promise<void>;
/**
 * Sets the root component first constructor call timestamp.
 * Used automatically by `Sentry.wrap` and `Sentry.ReactNativeProfiler`.
 */
export declare function setRootComponentCreationTimestampMs(timestampMs: number): void;
/**
 * For internal use only.
 *
 * @private
 */
export declare function _setRootComponentCreationTimestampMs(timestampMs: number): void;
/**
 * For internal use only.
 *
 * @private
 */
export declare const _setAppStartEndData: (data: AppStartEndData) => void;
/**
 * Updates only the endFrames on existing appStartEndData.
 * Used after the async fetchNativeFrames completes to attach frame data
 * without triggering the overwrite warning from _setAppStartEndData.
 *
 * @private
 */
export declare const _updateAppStartEndFrames: (endFrames: NativeFramesResponse | null) => void;
/**
 * For testing purposes only.
 *
 * @private
 */
export declare function _clearRootComponentCreationTimestampMs(): void;
/**
 * For testing purposes only.
 *
 * @private
 */
export declare function _clearAppStartEndData(): void;
/**
 * Adds AppStart spans from the native layer to the transaction event.
 */
export declare const appStartIntegration: ({ standalone, }?: {
    /**
     * Should the integration send App Start as a standalone root span (transaction)?
     * If false, App Start will be added as a child span to the first transaction.
     *
     * @default false
     */
    standalone?: boolean;
}) => AppStartIntegration;
export {};
//# sourceMappingURL=appStart.d.ts.map
