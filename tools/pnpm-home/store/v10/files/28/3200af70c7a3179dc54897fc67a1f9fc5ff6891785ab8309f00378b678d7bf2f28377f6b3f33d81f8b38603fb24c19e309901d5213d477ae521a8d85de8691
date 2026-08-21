/** Convert a Content-Length header to number/undefined. */
export declare function parseContentLengthHeader(header: string | null | undefined): number | undefined;
export type RequestBody = null | Blob | FormData | URLSearchParams | string | ArrayBuffer | undefined;
/** Get the size of a body. */
export declare function getBodySize(body: RequestBody): number | undefined;
export declare const NETWORK_BODY_MAX_SIZE = 150000;
/** How long to wait for an async body read (FileReader) before giving up. */
export declare const NETWORK_BODY_READ_TIMEOUT_MS = 500;
export declare const DEFAULT_NETWORK_HEADERS: string[];
export interface ResolvedNetworkOptions {
    allowUrls: (string | RegExp)[];
    denyUrls: (string | RegExp)[];
    captureBodies: boolean;
    requestHeaders: string[];
    responseHeaders: string[];
}
/**
 * Whether to capture full network details (headers, bodies) for a given URL,
 * based on the allow/deny URL lists.
 */
export declare function shouldCaptureNetworkDetails(url: string | undefined, options: ResolvedNetworkOptions): boolean;
export interface NetworkBody {
    body?: string;
    /** Warnings about the captured body, e.g. truncation or unserializable type. */
    _meta?: {
        warnings: string[];
    };
}
/**
 * Serialize a request/response body to a string, truncated to NETWORK_BODY_MAX_SIZE.
 * Returns undefined if the body is empty/missing; returns a meta warning if unserializable
 * or truncated.
 */
export declare function getBodyString(body: unknown): NetworkBody | undefined;
/**
 * Whether a Content-Type describes a payload that is safe to decode into text
 * (JSON, XML, form data, JavaScript, `text/*`). Genuinely binary payloads
 * (images, media, octet-stream) are excluded so they stay marked as unparseable.
 */
export declare function isTextLikeContentType(contentType: string | null | undefined): boolean;
/**
 * Rejection message used when a blob read completed but the engine could not
 * decode the bytes in the requested encoding. Distinguished from other failures
 * because it is the one case worth retrying with a different byte range.
 */
export declare const BLOB_DECODE_FAILED = "SentryBlobDecodeFailed";
/** Whether an error is the decode failure signalled by `readBlobAsText`. */
export declare function isBlobDecodeError(error: unknown): boolean;
/** The maximum number of bytes a single UTF-8 encoded code point can occupy. */
export declare const MAX_UTF8_SEQUENCE_BYTES = 4;
/**
 * Read a Blob as UTF-8 text via FileReader (React Native's Blob has no `text()`).
 * Rejects on read error, abort or after `timeoutMs`.
 */
export declare function readBlobAsText(blob: Blob, timeoutMs: number): Promise<string>;
/**
 * Decode UTF-8 bytes into a string. Uses the global TextDecoder when the JS
 * engine provides one and falls back to a manual decoder otherwise. Hermes and
 * JSC expose `TextEncoder` but no `TextDecoder`, so on React Native the manual
 * decoder is the path actually taken. Invalid sequences decode to U+FFFD.
 */
export declare function decodeUtf8(bytes: Uint8Array): string;
/**
 * Filter a headers map down to the set explicitly captured (defaults + user-supplied)
 * and strip authorization-like headers. Header name comparison is case-insensitive;
 * the returned keys are lowercased.
 */
export declare function filterHeaders(headers: Record<string, string | null | undefined> | undefined, extraAllowed: string[]): Record<string, string> | undefined;
/** Parse the raw string returned by XMLHttpRequest.getAllResponseHeaders() into a record. */
export declare function parseAllResponseHeaders(raw: string | null | undefined): Record<string, string>;
//# sourceMappingURL=networkUtils.d.ts.map