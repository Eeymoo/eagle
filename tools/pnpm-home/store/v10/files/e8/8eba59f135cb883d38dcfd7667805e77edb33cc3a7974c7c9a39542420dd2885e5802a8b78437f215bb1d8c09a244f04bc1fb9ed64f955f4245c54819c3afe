import type { MeasurementUnit, Span, SpanJSON, StartSpanOptions, TransactionSource } from '@sentry/core';
export declare const defaultTransactionSource: TransactionSource;
export declare const customTransactionSource: TransactionSource;
/**
 * A margin of error of 50ms is allowed for the async native bridge call.
 * Anything larger would reduce the accuracy of our frames measurements.
 */
export declare const MARGIN_OF_ERROR_SECONDS = 0.05;
/**
 * Returns the timestamp where the JS global scope was initialized.
 */
export declare function getTimeOriginMilliseconds(): number;
/**
 * Determines if the timestamp is now or within the specified margin of error from now.
 */
export declare function isNearToNow(timestamp: number | undefined): boolean;
/**
 * Sets the duration of the span as a measurement.
 * Uses `setMeasurement` function from @sentry/core.
 */
export declare function setSpanDurationAsMeasurement(name: string, span: Span): void;
/**
 * Sets the duration of the span as a measurement.
 * Uses `setMeasurement` function from @sentry/core.
 */
export declare function setSpanDurationAsMeasurementOnSpan(name: string, span: Span, on: Span): void;
/**
 * Sets measurement on the give span.
 */
export declare function setSpanMeasurement(span: Span, key: string, value: number, unit: MeasurementUnit): void;
/**
 * Returns the latest end timestamp of the child spans of the given span.
 */
export declare function getLatestChildSpanEndTimestamp(span: Span): number | undefined;
/**
 * Returns unix timestamp in ms of the bundle start time.
 *
 * If not available, returns undefined.
 */
export declare function getBundleStartTimestampMs(): number | undefined;
/**
 * Creates valid span JSON object from the given data.
 */
export declare function createSpanJSON(from: Partial<SpanJSON> & Pick<Required<SpanJSON>, 'description' | 'start_timestamp' | 'timestamp' | 'origin'>): SpanJSON;
/**
 * Wraps a function call that returns a `Promise` with an inactive span that
 * is automatically ended on success or failure (both sync throws and async
 * rejections).
 *
 * This is the standard pattern for instrumenting async SDK operations such as
 * `Image.loadAsync` and `Asset.loadAsync`.
 *
 * The span status is always set by this utility (`ok` on resolve, `error` on
 * reject or sync throw). If you need custom status logic (e.g. inspecting the
 * resolved value), handle span lifecycle manually instead.
 *
 * @param spanOptions  Options forwarded to `startInactiveSpan`.
 * @param fn           The function to call.
 * @returns            Whatever `fn` returns (the original `Promise`).
 */
export declare function traceAsyncOperation<T>(spanOptions: StartSpanOptions, fn: () => Promise<T>): Promise<T>;
/**
 * Strips query string and fragment from a URL, preserving the scheme, host, and path.
 */
export declare function sanitizeUrl(url: string): string;
/**
 * Extracts a short, human-readable description from a URL by stripping
 * the query string, fragment, and path — returning only the filename.
 */
export declare function describeUrl(url: string): string;
/**
 *
 */
export declare function createChildSpanJSON(parent: SpanJSON, from: Partial<SpanJSON> & Pick<Required<SpanJSON>, 'description' | 'start_timestamp' | 'timestamp'>): SpanJSON;
//# sourceMappingURL=utils.d.ts.map
