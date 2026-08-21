import { addBreadcrumb, defineIntegration, getClient } from '@sentry/core';
import { setPendingDeepLink } from '../tracing/pendingDeepLink';
import { sanitizeUrl } from '../tracing/utils';
export const INTEGRATION_NAME = 'DeepLink';
/**
 * Replaces dynamic path segments (UUID-like or numeric values) with a placeholder
 * to avoid capturing PII in path segments when `sendDefaultPii` is off.
 *
 * Only replaces segments that look like identifiers (all digits, UUIDs, or hex strings).
 *
 * Exported so the navigation integration can apply the same sanitization when
 * attaching a deep link URL to a navigation span.
 */
export function sanitizeDeepLinkUrl(url) {
    const stripped = sanitizeUrl(url);
    // Split off the scheme+authority (e.g. "myapp://host") so the regex
    // only operates on the path and cannot corrupt the hostname.
    const authorityEnd = stripped.indexOf('/', stripped.indexOf('//') + 2);
    if (authorityEnd === -1) {
        return stripped;
    }
    const authority = stripped.slice(0, authorityEnd);
    const path = stripped.slice(authorityEnd);
    // Replace path segments that look like dynamic IDs:
    // - Numeric segments (e.g. /123)
    // - UUID-formatted segments (e.g. /a1b2c3d4-e5f6-7890-abcd-ef1234567890)
    // - Hex strings ≥8 chars (e.g. /deadbeef1234)
    const sanitizedPath = path.replace(/\/([0-9]+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|[a-f0-9]{8,})(?=\/|$)/gi, '/<id>');
    return authority + sanitizedPath;
}
/**
 * Returns the URL to include in the breadcrumb, respecting `sendDefaultPii`.
 * When PII is disabled, query strings and ID-like path segments are removed.
 */
function getBreadcrumbUrl(url) {
    var _a, _b, _c;
    const sendDefaultPii = (_c = (_b = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getOptions()) === null || _b === void 0 ? void 0 : _b.sendDefaultPii) !== null && _c !== void 0 ? _c : false;
    return sendDefaultPii ? url : sanitizeDeepLinkUrl(url);
}
function recordDeepLink(url, source) {
    // Hand off to the navigation integration so the next idle navigation span
    // can attribute itself to this deep link. Always stores the raw URL —
    // sanitization (if any) happens at attach time, based on the client's
    // `sendDefaultPii` option at that moment.
    setPendingDeepLink(url, source);
    const breadcrumbUrl = getBreadcrumbUrl(url);
    addBreadcrumb({
        category: 'deeplink',
        type: 'navigation',
        message: breadcrumbUrl,
        data: {
            url: breadcrumbUrl,
        },
    });
}
const _deeplinkIntegration = () => {
    let subscription;
    return {
        name: INTEGRATION_NAME,
        setup(client) {
            const linking = tryGetLinking();
            if (!linking) {
                return;
            }
            // Remove previous subscription if setup is called again (e.g. repeated Sentry.init)
            subscription === null || subscription === void 0 ? void 0 : subscription.remove();
            // Cold start: app opened via deep link
            linking
                .getInitialURL()
                .then((url) => {
                if (url) {
                    recordDeepLink(url, 'cold-start');
                }
            })
                .catch(() => {
                // Ignore errors from getInitialURL
            });
            // Warm open: deep link received while app is running
            subscription = linking.addEventListener('url', (event) => {
                if (event === null || event === void 0 ? void 0 : event.url) {
                    recordDeepLink(event.url, 'warm-open');
                }
            });
            client.on('close', () => {
                subscription === null || subscription === void 0 ? void 0 : subscription.remove();
                subscription = undefined;
            });
        },
    };
};
/**
 * Attempts to import React Native's Linking module without a hard dependency.
 * Returns null if not available (e.g. in web environments).
 */
function tryGetLinking() {
    var _a;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return (_a = require('react-native').Linking) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        return null;
    }
}
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
export const deeplinkIntegration = defineIntegration(_deeplinkIntegration);
//# sourceMappingURL=deeplink.js.map