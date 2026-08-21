/**
 * Cross-module hand-off between {@link wrapExpoRouter} and the
 * {@link reactNavigationIntegration} idle navigation span.
 *
 * When an Expo Router method (push / replace / navigate / back / dismiss) is
 * called, it stores the initiating method here. The next idle navigation span
 * consumes (and clears) this value so the span can be attributed to the call
 * site via the `navigation.method` attribute.
 */
let pending;
/** Stores the initiating Expo Router navigation call. Overwrites any previous pending value. */
export function setPendingExpoRouterNavigation(value) {
    pending = value;
}
/** Returns and clears the pending Expo Router navigation, if any. */
export function consumePendingExpoRouterNavigation() {
    const value = pending;
    pending = undefined;
    return value;
}
/** Test helper — clears the pending value without consuming it. */
export function clearPendingExpoRouterNavigation() {
    pending = undefined;
}
//# sourceMappingURL=pendingExpoRouterNavigation.js.map