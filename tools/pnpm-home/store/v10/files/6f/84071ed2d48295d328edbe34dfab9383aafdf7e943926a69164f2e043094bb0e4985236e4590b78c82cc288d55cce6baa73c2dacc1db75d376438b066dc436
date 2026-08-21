/**
 * Encodes a byte array to base64. Uses the runtime's native `btoa` when
 * available — Hermes exposes it natively, and some JSC builds do too — which
 * is significantly faster than the pure-JS encoder for the envelope payloads
 * going through `RNSentry.captureEnvelope`. Falls back to the bundled JS
 * encoder when `btoa` is missing.
 */
export declare function encodeToBase64(bytes: Uint8Array): string;
//# sourceMappingURL=base64.d.ts.map