/**
 * Cross-module hand-off between {@link wrapExpoRouter} and the
 * {@link reactNavigationIntegration} idle navigation span.
 *
 * When an Expo Router method (push / replace / navigate / back / dismiss) is
 * called, it stores the initiating method here. The next idle navigation span
 * consumes (and clears) this value so the span can be attributed to the call
 * site via the `navigation.method` attribute.
 */
export interface PendingExpoRouterNavigation {
    /** The Expo Router method that initiated the navigation. */
    method: 'push' | 'replace' | 'navigate' | 'back' | 'dismiss';
}
/** Stores the initiating Expo Router navigation call. Overwrites any previous pending value. */
export declare function setPendingExpoRouterNavigation(value: PendingExpoRouterNavigation): void;
/** Returns and clears the pending Expo Router navigation, if any. */
export declare function consumePendingExpoRouterNavigation(): PendingExpoRouterNavigation | undefined;
/** Test helper — clears the pending value without consuming it. */
export declare function clearPendingExpoRouterNavigation(): void;
//# sourceMappingURL=pendingExpoRouterNavigation.d.ts.map
