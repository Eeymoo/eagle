import type { Client, Event, Span } from '@sentry/core';
/**
 * Attribute used to mark root spans whose corresponding transaction event
 * should be dropped by the React Native tracing event processor instead of
 * being treated as sampled-out by `@sentry/core`.
 *
 * The value is a stable string identifier describing why the SDK chose to
 * discard the transaction (e.g. an empty back-navigation, a route-change
 * transaction that never received route information, or a childless idle
 * transaction).
 */
export declare const SENTRY_DISCARD_REASON_ATTRIBUTE = "sentry.rn.discard_reason";
export type SentryDiscardReason = 'empty_back_navigation' | 'no_route_info' | 'no_child_spans' | 'discarded_latest_navigation';
/**
 * Marks a root span so its transaction event will be filtered out by the
 * tracing integration's event processor. The span itself is left with its
 * original sampling decision so debug logs no longer report "dropped due to
 * sampling" for SDK-side discards.
 */
export declare function markRootSpanForDiscard(span: Span, reason: SentryDiscardReason): void;
/**
 * Returns the SDK-side discard reason recorded on a root span, if any.
 */
export declare function getRootSpanDiscardReason(span: Span): SentryDiscardReason | undefined;
/**
 * Returns the SDK-side discard reason from a transaction event, if any.
 */
export declare function getTransactionEventDiscardReason(event: Event): SentryDiscardReason | undefined;
/**
 * Hooks on span end event to execute a callback when the span ends.
 */
export declare function onThisSpanEnd(client: Client, span: Span, callback: (span: Span) => void): void;
export declare const adjustTransactionDuration: (client: Client, span: Span, maxDurationMs: number) => void;
export declare const ignoreEmptyBackNavigation: (client: Client | undefined, span: Span | undefined) => void;
/**
 * Discards empty "Route Change" transactions that never received route information.
 * This happens when navigation library emits a route change event but getCurrentRoute() returns undefined.
 * Such transactions don't contain any useful information and should not be sent to Sentry.
 *
 * This function must be called with a reference tracker function that can check if the span
 * was cleared from the integration's tracking (indicating it went through the state listener).
 */
export declare const ignoreEmptyRouteChangeTransactions: (client: Client | undefined, span: Span | undefined, defaultNavigationSpanName: string, isSpanStillTracked: () => boolean) => void;
/**
 * Idle Transaction callback to only sample transactions with child spans.
 * To avoid side effects of other callbacks this should be hooked as the last callback.
 */
export declare const onlySampleIfChildSpans: (client: Client, span: Span) => void;
/**
 * Hooks on AppState change to cancel the span if the app goes background.
 *
 * On iOS the JS thread can be suspended between the `inactive` and
 * `background` transitions, which means the `background` event may never
 * reach JS in time. To handle this we schedule a deferred cancellation when
 * the app becomes `inactive`. If the app returns to `active` before the
 * timeout fires, the cancellation is cleared. If it transitions to
 * `background` first, we cancel immediately and clear the timeout.
 */
export declare const cancelInBackground: (client: Client, span: Span) => void;
//# sourceMappingURL=onSpanEndUtils.d.ts.map
