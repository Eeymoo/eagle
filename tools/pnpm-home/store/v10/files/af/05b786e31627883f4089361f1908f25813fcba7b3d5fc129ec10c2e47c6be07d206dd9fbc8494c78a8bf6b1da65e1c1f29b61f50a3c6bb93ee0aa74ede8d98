import { debug, generateTraceId, getActiveSpan, getClient, getCurrentScope, SEMANTIC_ATTRIBUTE_SENTRY_OP, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SentryNonRecordingSpan, SPAN_STATUS_ERROR, spanToJSON, startIdleSpan as coreStartIdleSpan, } from '@sentry/core';
import { AppState, Platform } from 'react-native';
import { isRootSpan } from '../utils/span';
import { adjustTransactionDuration, cancelInBackground } from './onSpanEndUtils';
import { SPAN_ORIGIN_AUTO_INTERACTION, SPAN_ORIGIN_AUTO_NAVIGATION_CUSTOM, SPAN_ORIGIN_MANUAL_INTERACTION, } from './origin';
export const DEFAULT_NAVIGATION_SPAN_NAME = 'Route Change';
export const defaultIdleOptions = {
    idleTimeout: 1000,
    finalTimeout: 600000,
};
export const startIdleNavigationSpan = (startSpanOption, { finalTimeout = defaultIdleOptions.finalTimeout, idleTimeout = defaultIdleOptions.idleTimeout, isAppRestart = false, } = {}) => {
    const client = getClient();
    if (!client) {
        debug.warn("[startIdleNavigationSpan] Can't create route change span, missing client.");
        return undefined;
    }
    const activeSpan = getActiveSpan();
    const isActiveSpanInteraction = activeSpan && isRootSpan(activeSpan) && isSentryInteractionSpan(activeSpan);
    clearActiveSpanFromScope(getCurrentScope());
    // Don't cancel user interaction spans when starting from runApplication (app restart/reload).
    // This preserves the span context for error capture and replay recording.
    if (isActiveSpanInteraction && isAppRestart) {
        debug.log(`[startIdleNavigationSpan] Not canceling ${spanToJSON(activeSpan).op} transaction because navigation is from app restart - preserving error context.`);
        // Don't end the span - it will timeout naturally and remains available for error/replay processing
    }
    else if (isActiveSpanInteraction) {
        debug.log(`[startIdleNavigationSpan] Canceling ${spanToJSON(activeSpan).op} transaction because of a new navigation root span.`);
        activeSpan.setStatus({ code: SPAN_STATUS_ERROR, message: 'cancelled' });
        activeSpan.end();
    }
    const finalStartSpanOptions = Object.assign(Object.assign({}, getDefaultIdleNavigationSpanOptions()), startSpanOption);
    const idleSpan = startIdleSpan(finalStartSpanOptions, { finalTimeout, idleTimeout });
    debug.log(`[startIdleNavigationSpan] Starting ${finalStartSpanOptions.op || 'unknown op'} transaction "${finalStartSpanOptions.name}" on scope`);
    adjustTransactionDuration(client, idleSpan, finalTimeout);
    idleSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SPAN_ORIGIN_AUTO_NAVIGATION_CUSTOM);
    return idleSpan;
};
/**
 * Starts an idle span from `@sentry/core` with React Native application
 * context awareness.
 *
 * - Span will be started with new propagation context.
 * - Span will be canceled if the app goes to background.
 */
export const startIdleSpan = (startSpanOption, { finalTimeout, idleTimeout }) => {
    const client = getClient();
    if (!client) {
        debug.warn("[startIdleSpan] Can't create idle span, missing client.");
        return new SentryNonRecordingSpan();
    }
    const currentAppState = AppState.currentState;
    if (currentAppState === 'background' || (Platform.OS === 'ios' && currentAppState === 'inactive')) {
        debug.log(`[startIdleSpan] App is already in '${currentAppState}' state, not starting span for ${startSpanOption.name}`);
        return new SentryNonRecordingSpan();
    }
    getCurrentScope().setPropagationContext({ traceId: generateTraceId(), sampleRand: Math.random() });
    const span = coreStartIdleSpan(startSpanOption, { finalTimeout, idleTimeout });
    cancelInBackground(client, span);
    return span;
};
/**
 * Returns the default options for the idle navigation span.
 */
export function getDefaultIdleNavigationSpanOptions() {
    return {
        name: DEFAULT_NAVIGATION_SPAN_NAME,
        op: 'navigation',
        forceTransaction: true,
        scope: getCurrentScope(),
    };
}
/**
 * Checks if the span is a Sentry User Interaction span.
 */
export function isSentryInteractionSpan(span) {
    return [SPAN_ORIGIN_AUTO_INTERACTION, SPAN_ORIGIN_MANUAL_INTERACTION].includes(spanToJSON(span).origin || '');
}
export const SCOPE_SPAN_FIELD = '_sentrySpan';
/**
 * Removes the active span from the scope.
 */
export function clearActiveSpanFromScope(scope) {
    // oxlint-disable-next-line typescript-eslint(no-dynamic-delete)
    delete scope[SCOPE_SPAN_FIELD];
}
/**
 * Ensures that all created spans have an operation name.
 */
export function addDefaultOpForSpanFrom(client) {
    client.on('spanStart', (span) => {
        if (!spanToJSON(span).op) {
            span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_OP, 'default');
        }
    });
}
export const SPAN_THREAD_NAME = 'thread.name';
export const SPAN_THREAD_NAME_MAIN = 'main';
export const SPAN_THREAD_NAME_JAVASCRIPT = 'javascript';
/**
 * Adds Javascript thread info to spans.
 * Ref: https://reactnative.dev/architecture/threading-model
 */
export function addThreadInfoToSpan(client) {
    client.on('spanStart', (span) => {
        var _a;
        if (!((_a = spanToJSON(span).data) === null || _a === void 0 ? void 0 : _a[SPAN_THREAD_NAME])) {
            span.setAttribute(SPAN_THREAD_NAME, SPAN_THREAD_NAME_JAVASCRIPT);
        }
    });
}
/**
 * Sets the Main thread info to the span.
 */
export function setMainThreadInfo(spanJSON) {
    spanJSON.data = spanJSON.data || {};
    spanJSON.data[SPAN_THREAD_NAME] = SPAN_THREAD_NAME_MAIN;
    return spanJSON;
}
//# sourceMappingURL=span.js.map