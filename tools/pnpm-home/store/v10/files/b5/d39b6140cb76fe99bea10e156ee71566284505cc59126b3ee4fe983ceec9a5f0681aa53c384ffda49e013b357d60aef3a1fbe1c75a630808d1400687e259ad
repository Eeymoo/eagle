import type { NativeLogEntry } from './options';
/**
 * Sets up the native log listener that forwards logs from the native SDK to JS.
 * This only works when `debug: true` is set in Sentry options.
 *
 * @param callback - The callback to invoke when a native log is received.
 * @returns A function to remove the listener, or undefined if setup failed.
 */
export declare function setupNativeLogListener(callback: (log: NativeLogEntry) => void): (() => void) | undefined;
/**
 * Default handler for native logs that uses Sentry's debug logger.
 * This avoids interference with captureConsoleIntegration which would
 * otherwise capture these logs as breadcrumbs or events.
 */
export declare function defaultNativeLogHandler(log: NativeLogEntry): void;
//# sourceMappingURL=NativeLogListener.d.ts.map
