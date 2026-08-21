import type { Breadcrumb, BreadcrumbHint, SentryWrappedXMLHttpRequest, XhrBreadcrumbHint } from '@sentry/core';
import type { NetworkBody, RequestBody, ResolvedNetworkOptions } from './networkUtils';
/**
 * Hint key carrying the result of `resolveXhrResponseBody` for a breadcrumb
 * whose binary (Blob / ArrayBuffer) response body was read asynchronously. When
 * present, enrichment reads the body and all request / response metadata from
 * this snapshot instead of the live `xhr`, which may have been reused or cleared
 * by the time the read settles.
 */
export declare const REPLAY_RESOLVED_RESPONSE_BODY_HINT_KEY = "__mobile_replay_resolved_response_body__";
/**
 * An asynchronously resolved response body plus the request / response
 * metadata snapshotted synchronously at the time the read was started.
 */
export interface ResolvedXhrResponse {
    body: NetworkBody;
    requestHeaders: Record<string, string> | undefined;
    rawResponseHeaders: string | null;
    responseBodySize: number | undefined;
}
/**
 * Build a `beforeAddBreadcrumb` handler that enriches XHR breadcrumbs with
 * network details (sizes always; headers/bodies for URLs matching the allow
 * list and not the deny list) for the Mobile Replay network tab.
 */
export declare function makeEnrichXhrBreadcrumbsForMobileReplay(networkOptions: ResolvedNetworkOptions): (breadcrumb: Breadcrumb, hint: BreadcrumbHint | undefined) => void;
/**
 * Enrich an XHR breadcrumb with additional data for Mobile Replay network tab.
 * Preserves the legacy behaviour: sizes only, no headers/bodies.
 */
export declare function enrichXhrBreadcrumbsForMobileReplay(breadcrumb: Breadcrumb, hint: BreadcrumbHint | undefined): void;
type XhrHint = XhrBreadcrumbHint & {
    xhr: XMLHttpRequest & SentryWrappedXMLHttpRequest;
    input?: RequestBody;
};
/**
 * Whether this xhr breadcrumb's response body can only be captured asynchronously:
 * a binary responseType (`blob` / `arraybuffer`) holding a text-like payload, for
 * an allow-listed URL with body capture enabled. React Native's `fetch` polyfill
 * always uses responseType `blob`, so every `fetch` response takes this path.
 */
export declare function shouldCaptureResponseBodyAsync(breadcrumb: Breadcrumb, hint: BreadcrumbHint | undefined, networkOptions: ResolvedNetworkOptions): hint is XhrHint;
/**
 * Read the body of a binary (`blob` / `arraybuffer`) XHR response and serialize
 * it like a text body (size cap + truncation warning), together with the
 * request / response metadata snapshotted synchronously — by the time the body
 * read settles, the xhr may have been reused or cleared, so the enriched
 * breadcrumb must not read from it again. Resolves the body to an
 * UNPARSEABLE_BODY_TYPE warning on read failure or timeout — never rejects.
 */
export declare function resolveXhrResponseBody(xhr: XMLHttpRequest & SentryWrappedXMLHttpRequest): Promise<ResolvedXhrResponse>;
/**
 * Build a copy of an already-enriched xhr breadcrumb with its network details
 * rebuilt from an asynchronously resolved response body.
 *
 * The original breadcrumb is left untouched: it is already on the JavaScript
 * scope (and possibly attached to events), and the normalized copy the scope
 * holds is a different object anyway. The returned breadcrumb is meant to be
 * forwarded to the native SDKs, which is what feeds the Replay network tab.
 */
export declare function buildResolvedNetworkBreadcrumb(breadcrumb: Breadcrumb, hint: BreadcrumbHint, resolved: ResolvedXhrResponse, networkOptions: ResolvedNetworkOptions): Breadcrumb;
export {};
//# sourceMappingURL=xhrUtils.d.ts.map
