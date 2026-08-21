import { getClient } from '@sentry/core';
/**
 * Registers a no-op named integration on the client so the feature name flows
 * through to `event.sdk.integrations` — the channel Sentry uses to measure
 * feature adoption across SDKs.
 *
 * The registration is idempotent: a second call with the same name is a no-op
 * because `getIntegrationByName` returns the existing entry.
 *
 * Failing quietly is intentional. Feature-adoption telemetry must never break
 * the host app: if no client is available, or `addIntegration` is unavailable,
 * the caller keeps working without a marker.
 *
 * @param name The name to register.
 * @param client Optional explicit client. Falls back to `getClient()`.
 */
export function registerFeatureMarker(name, client = getClient()) {
    var _a, _b;
    if (!client || ((_a = client.getIntegrationByName) === null || _a === void 0 ? void 0 : _a.call(client, name))) {
        return;
    }
    (_b = client.addIntegration) === null || _b === void 0 ? void 0 : _b.call(client, { name });
}
//# sourceMappingURL=featureMarkers.js.map