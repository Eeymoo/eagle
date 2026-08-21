import type { Client, Integration } from '@sentry/core';
export declare const INTEGRATION_NAME = "ReactNavigation";
/**
 * Extracts dynamic route parameters from a route name and its params.
 * Matches Expo Router style dynamic segments like `[id]` and `[...slug]`.
 *
 * Only params whose keys appear as dynamic segments in the route name are returned,
 * filtering out non-structural params (query params, etc.) that may contain PII.
 *
 * Note: dynamic segment values (e.g. the `123` in `profile/[id]`) may be user-identifiable.
 * This function only extracts params — callers are responsible for checking `sendDefaultPii`
 * before including the result in span attributes.
 *
 * Previous route params are intentionally not captured — only the current route's
 * structural params are needed for trace attribution.
 */
export declare function extractDynamicRouteParams(routeName: string, params?: Record<string, unknown>): Record<string, string> | undefined;
/**
 * Optional route override provided by another integration (e.g. Expo Router).
 *
 * When supplied, the route name and related attributes are derived from this
 * override instead of React Navigation's `getCurrentRoute().name`, so we can
 * report meaningful templated paths (e.g. `/profile/[id]`) instead of file
 * names like `index` or `(tabs)`.
 */
export interface RouteOverride {
    templatedPath: string;
    concreteUrl?: string;
    params?: Record<string, unknown>;
}
export type RouteOverrideProvider = () => RouteOverride | undefined;
interface ReactNavigationIntegrationOptions {
    /**
     * How long the instrumentation will wait for the route to mount after a change has been initiated,
     * before the transaction is discarded.
     *
     * @default 1_000 (ms)
     */
    routeChangeTimeoutMs: number;
    /**
     * Time to initial display measures the time it takes from
     * navigation dispatch to the render of the first frame of the new screen.
     *
     * Note: Enabling this adds native bridge calls on every navigation
     * which may cause noticeable overhead on low-end devices.
     *
     * @default false
     */
    enableTimeToInitialDisplay: boolean;
    /**
     * Does not sample transactions that are from routes that have been seen any more and don't have any spans.
     * This removes a lot of the clutter as most back navigation transactions are now ignored.
     *
     * @default true
     */
    ignoreEmptyBackNavigationTransactions: boolean;
    /**
     * Enabled measuring Time to Initial Display for routes that are already loaded in memory.
     * (a.k.a., Routes that the navigation integration has already seen.)
     *
     * @default false
     */
    enableTimeToInitialDisplayForPreloadedRoutes: boolean;
    /**
     * Whether to use the dispatched action data to populate the transaction metadata.
     *
     * @default false
     */
    useDispatchedActionData: boolean;
    /**
     * Whether to use the full paths for navigation routes.
     *
     * @default false
     */
    useFullPathsForNavigationRoutes: boolean;
    /**
     * Track performance of route prefetching operations.
     * Creates separate spans for PRELOAD actions to measure prefetch performance.
     * This is useful for Expo Router apps that use the prefetch functionality.
     *
     * @default false
     */
    enablePrefetchTracking: boolean;
}
/**
 * Instrumentation for React-Navigation V5 and above. See docs or sample app for usage.
 *
 * How this works:
 * - `_onDispatch` is called every time a dispatch happens and sets an IdleTransaction on the scope without any route context.
 * - `_onStateChange` is then called AFTER the state change happens due to a dispatch and sets the route context onto the active transaction.
 * - If `_onStateChange` isn't called within `STATE_CHANGE_TIMEOUT_DURATION` of the dispatch, then the transaction is not sampled and finished.
 */
export declare const reactNavigationIntegration: ({ routeChangeTimeoutMs, enableTimeToInitialDisplay, ignoreEmptyBackNavigationTransactions, enableTimeToInitialDisplayForPreloadedRoutes, useDispatchedActionData, useFullPathsForNavigationRoutes, enablePrefetchTracking, }?: Partial<ReactNavigationIntegrationOptions>) => Integration & {
    /**
     * Pass the ref to the navigation container to register it to the instrumentation
     * @param navigationContainerRef Ref to a `NavigationContainer`
     */
    registerNavigationContainer: (navigationContainerRef: unknown) => void;
    /**
     * @internal API: allow another integration (for example, Expo Router integration) to
     * supply the canonical route info on every state change. Use `undefined` to clear.
     */
    _setRouteOverrideProvider: (provider: RouteOverrideProvider | undefined) => void;
    options: ReactNavigationIntegrationOptions;
};
export interface NavigationRoute {
    name: string;
    key: string;
    params?: Record<string, any>;
    state?: NavigationState;
}
interface NavigationState {
    index?: number;
    routes: NavigationRoute[];
}
/**
 * Returns React Navigation integration of the given client.
 */
export declare function getReactNavigationIntegration(client: Client): ReturnType<typeof reactNavigationIntegration> | undefined;
export {};
//# sourceMappingURL=reactnavigation.d.ts.map