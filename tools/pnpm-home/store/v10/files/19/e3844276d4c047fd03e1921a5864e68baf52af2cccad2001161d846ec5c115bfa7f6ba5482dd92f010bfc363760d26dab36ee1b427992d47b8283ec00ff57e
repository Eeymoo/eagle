import * as React from 'react';
export declare const EXPO_ROUTER_ERROR_BOUNDARY_INTEGRATION_NAME = "ExpoRouterErrorBoundary";
/**
 * The minimal shape of Expo Router's per-route `ErrorBoundary` props.
 *
 * We re-declare it here to avoid a hard dependency on `expo-router`.
 */
export interface ExpoRouterErrorBoundaryProps {
    error: Error;
    retry: () => Promise<void>;
}
/**
 * Wraps Expo Router's per-route `ErrorBoundary` so that the SDK captures
 * errors that hit the boundary instead of relying on the user's global error
 * handler.
 *
 * Expo Router renders the boundary exported from a route file
 * (`export { ErrorBoundary } from 'expo-router'`) when a component throws
 * during render. Without this wrapper, Sentry only sees the error if it also
 * reaches `ErrorUtils` — which it often does not, because React swallows the
 * error once a boundary handles it.
 *
 * For each new `error` instance the wrapper:
 *  - Captures the error to Sentry with `route.name`, `route.path`, and
 *    `route.params` attached, gated by `sendDefaultPii` for concrete fields.
 *  - Tags the active idle navigation span (and its root) with
 *    `SPAN_STATUS_ERROR` so the navigation transaction reflects the failure.
 *  - Adds a breadcrumb describing the boundary render.
 *
 * @example
 * ```ts
 * // app/_layout.tsx
 * import { ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
 * import * as Sentry from '@sentry/react-native';
 *
 * export const ErrorBoundary = Sentry.wrapExpoRouterErrorBoundary(ExpoErrorBoundary);
 * ```
 */
export declare function wrapExpoRouterErrorBoundary<P extends ExpoRouterErrorBoundaryProps>(OriginalErrorBoundary: React.ComponentType<P>): React.ComponentType<P>;
//# sourceMappingURL=expoRouterErrorBoundary.d.ts.map
