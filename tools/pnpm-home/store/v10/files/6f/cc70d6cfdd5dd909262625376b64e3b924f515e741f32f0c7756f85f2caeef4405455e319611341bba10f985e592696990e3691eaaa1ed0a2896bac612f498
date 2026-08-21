export declare const INTEGRATION_NAME = "DeepLink";
/**
 * Replaces dynamic path segments (UUID-like or numeric values) with a placeholder
 * to avoid capturing PII in path segments when `sendDefaultPii` is off.
 *
 * Only replaces segments that look like identifiers (all digits, UUIDs, or hex strings).
 *
 * Exported so the navigation integration can apply the same sanitization when
 * attaching a deep link URL to a navigation span.
 */
export declare function sanitizeDeepLinkUrl(url: string): string;
/**
 * Integration that automatically captures breadcrumbs when deep links are received.
 *
 * Intercepts links via React Native's `Linking` API:
 * - `getInitialURL` for cold starts (app opened via deep link)
 * - `addEventListener('url', ...)` for warm opens (link received while running)
 *
 * Respects `sendDefaultPii`: when disabled, query params and ID-like path segments
 * are stripped from the URL before it is recorded.
 *
 * Compatible with both Expo Router and plain React Navigation deep linking.
 *
 * @example
 * ```ts
 * Sentry.init({
 *   integrations: [deeplinkIntegration()],
 * });
 * ```
 */
export declare const deeplinkIntegration: (...args: any[]) => import("@sentry/core").Integration & {
    name: string;
};
//# sourceMappingURL=deeplink.d.ts.map
