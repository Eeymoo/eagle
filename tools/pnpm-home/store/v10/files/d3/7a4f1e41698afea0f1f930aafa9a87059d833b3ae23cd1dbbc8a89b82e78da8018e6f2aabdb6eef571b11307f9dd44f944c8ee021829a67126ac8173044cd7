/**
 * Cross-module hand-off between the {@link deeplinkIntegration} and the
 * {@link reactNavigationIntegration} idle navigation span.
 *
 * Two delivery modes are supported, both of which need to work in practice:
 *
 * 1. **Pre-navigation (warm open / normal cold start):** the deep link is
 *    received before any navigation has been dispatched. The URL is stored in
 *    a single slot here; the next idle navigation span consumes it inside
 *    `updateLatestNavigationSpanWithCurrentRoute` (within `routeChangeTimeoutMs`).
 *
 * 2. **Late arrival (Expo Router auto-handled cold start):** Expo Router reads
 *    `Linking.getInitialURL()` independently and may finish the initial
 *    navigation *before* our integration's own `getInitialURL().then(...)`
 *    chain resolves. To still attribute that span, a synchronous listener may
 *    be registered (by the navigation integration) and receives every link as
 *    it arrives. If it tags a still-recording span, it returns `true` and the
 *    slot is left empty — otherwise the link falls through to the slot.
 */
let pending;
let listener;
let seqCounter = 0;
/**
 * Returns the next value in the shared monotonic sequence. Used by the
 * navigation integration to stamp each dispatched nav span, so consumers can
 * tell whether a pending link arrived before or after a given dispatch.
 */
export function nextEventSeq() {
    return ++seqCounter;
}
/**
 * Stores the most recently received deep link URL together with the current
 * timestamp. If a listener is registered and consumes the link synchronously,
 * the slot is left empty.
 *
 * Overwrites any previous unconsumed pending value — only the latest link
 * matters for correlation with the next navigation.
 */
export function setPendingDeepLink(url, source) {
    const value = {
        url,
        receivedAtMs: Date.now(),
        source,
        seq: nextEventSeq(),
    };
    if (listener === null || listener === void 0 ? void 0 : listener(value)) {
        return;
    }
    pending = value;
}
/**
 * Returns the pending deep link without clearing the slot, applying the same
 * staleness check as {@link consumePendingDeepLink}. A stale value is dropped
 * (so subsequent calls do not return it) but no fresh value is returned.
 */
export function peekPendingDeepLink(maxAgeMs) {
    if (!pending) {
        return undefined;
    }
    if (Date.now() - pending.receivedAtMs > maxAgeMs) {
        pending = undefined;
        return undefined;
    }
    return pending;
}
/**
 * Returns and clears the pending deep link, but only if it was received
 * within `maxAgeMs` of "now". Stale entries are discarded and the slot is
 * cleared in all cases.
 */
export function consumePendingDeepLink(maxAgeMs) {
    const value = pending;
    pending = undefined;
    if (!value) {
        return undefined;
    }
    if (Date.now() - value.receivedAtMs > maxAgeMs) {
        return undefined;
    }
    return value;
}
/**
 * Registers a synchronous listener that is invoked on every {@link setPendingDeepLink}
 * call. Pass `undefined` to unregister. Only a single listener is supported —
 * a new registration replaces the previous one.
 */
export function setPendingDeepLinkListener(fn) {
    listener = fn;
}
/** Test helper — clears the pending value, listener, and sequence counter. */
export function clearPendingDeepLink() {
    pending = undefined;
    listener = undefined;
    seqCounter = 0;
}
//# sourceMappingURL=pendingDeepLink.js.map