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
import { debug } from '@sentry/core';
import { RN_GLOBAL_OBJ } from '../utils/worldwide';
function getBus() {
    const host = RN_GLOBAL_OBJ;
    if (!host.__SENTRY_RN_GLOBAL_ERROR_BUS__) {
        host.__SENTRY_RN_GLOBAL_ERROR_BUS__ = { subscribers: new Set() };
    }
    return host.__SENTRY_RN_GLOBAL_ERROR_BUS__;
}
/**
 * Subscribe to global errors. Returns an unsubscribe function.
 */
export function subscribeGlobalError(listener, options = {}) {
    var _a, _b, _c;
    const subscriber = {
        listener,
        options: {
            fatal: (_a = options.fatal) !== null && _a !== void 0 ? _a : true,
            nonFatal: (_b = options.nonFatal) !== null && _b !== void 0 ? _b : false,
            unhandledRejection: (_c = options.unhandledRejection) !== null && _c !== void 0 ? _c : false,
        },
    };
    getBus().subscribers.add(subscriber);
    return () => {
        getBus().subscribers.delete(subscriber);
    };
}
/**
 * Returns true if at least one subscriber is interested in the given event.
 *
 * Used by the error handlers integration to decide whether to skip invoking
 * React Native's default error handler (which would otherwise tear down the
 * JS context and prevent any fallback UI from rendering).
 */
export function hasInterestedSubscribers(kind, isFatal) {
    for (const { options } of getBus().subscribers) {
        if (kind === 'onerror') {
            if (isFatal ? options.fatal : options.nonFatal)
                return true;
        }
        else if (kind === 'onunhandledrejection' && options.unhandledRejection) {
            return true;
        }
    }
    return false;
}
/**
 * Publish a global error to all interested subscribers. Each listener runs
 * isolated in try/catch so a misbehaving subscriber cannot interrupt others
 * or unwind into the caller (the error handlers integration depends on
 * publish never throwing so its `handlingFatal` latch is always released).
 */
export function publishGlobalError(event) {
    for (const { listener, options } of getBus().subscribers) {
        const interested = event.kind === 'onerror'
            ? event.isFatal
                ? options.fatal
                : options.nonFatal
            : event.kind === 'onunhandledrejection' && options.unhandledRejection;
        if (!interested)
            continue;
        try {
            listener(event);
        }
        catch (e) {
            debug.error('[GlobalErrorBus] Subscriber threw while handling a global error.', e);
        }
    }
}
/** Test-only: clear all subscribers. */
export function _resetGlobalErrorBus() {
    getBus().subscribers.clear();
}
//# sourceMappingURL=globalErrorBus.js.map