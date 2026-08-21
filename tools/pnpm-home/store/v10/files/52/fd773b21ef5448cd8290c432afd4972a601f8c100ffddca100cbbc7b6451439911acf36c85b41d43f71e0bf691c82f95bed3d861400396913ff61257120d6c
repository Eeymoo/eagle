import { SPAN_STATUS_ERROR, SPAN_STATUS_OK, startInactiveSpan } from '@sentry/core';
import { SPAN_ORIGIN_AUTO_RESOURCE_EXPO_IMAGE } from './origin';
import { describeUrl, sanitizeUrl, traceAsyncOperation } from './utils';
/**
 * Wraps expo-image's `Image` class to add automated performance monitoring.
 *
 * This function instruments `Image.prefetch` and `Image.loadAsync` static methods
 * to create performance spans that measure how long image prefetching and loading take.
 *
 * @param imageClass - The `Image` class from `expo-image`
 * @returns The same class with instrumented static methods
 *
 * @example
 * ```typescript
 * import { Image } from 'expo-image';
 * import * as Sentry from '@sentry/react-native';
 *
 * Sentry.wrapExpoImage(Image);
 * ```
 */
export function wrapExpoImage(imageClass) {
    if (!imageClass) {
        return imageClass;
    }
    if (imageClass.__sentryWrapped) {
        return imageClass;
    }
    wrapPrefetch(imageClass);
    wrapLoadAsync(imageClass);
    imageClass.__sentryWrapped = true;
    return imageClass;
}
function wrapPrefetch(imageClass) {
    if (!imageClass.prefetch) {
        return;
    }
    const originalPrefetch = imageClass.prefetch.bind(imageClass);
    // oxlint-disable-next-line typescript-eslint(no-explicit-any)
    imageClass.prefetch = ((urls, cachePolicyOrOptions) => {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const urlCount = urlList.length;
        const firstUrl = urlList[0] || 'unknown';
        const description = urlCount === 1 ? describeUrl(firstUrl) : `${urlCount} images`;
        const span = startInactiveSpan({
            op: 'resource.image.prefetch',
            name: `Image prefetch ${description}`,
            attributes: Object.assign({ 'sentry.origin': SPAN_ORIGIN_AUTO_RESOURCE_EXPO_IMAGE, 'image.url_count': urlCount }, (urlCount === 1 ? { 'image.url': sanitizeUrl(firstUrl) } : undefined)),
        });
        try {
            return originalPrefetch(urls, cachePolicyOrOptions)
                .then(result => {
                if (result) {
                    span === null || span === void 0 ? void 0 : span.setStatus({ code: SPAN_STATUS_OK });
                }
                else {
                    span === null || span === void 0 ? void 0 : span.setStatus({ code: SPAN_STATUS_ERROR, message: 'prefetch_failed' });
                }
                span === null || span === void 0 ? void 0 : span.end();
                return result;
            })
                .catch((error) => {
                span === null || span === void 0 ? void 0 : span.setStatus({ code: SPAN_STATUS_ERROR, message: String(error) });
                span === null || span === void 0 ? void 0 : span.end();
                throw error;
            });
        }
        catch (error) {
            span === null || span === void 0 ? void 0 : span.setStatus({ code: SPAN_STATUS_ERROR, message: String(error) });
            span === null || span === void 0 ? void 0 : span.end();
            throw error;
        }
    });
}
function wrapLoadAsync(imageClass) {
    if (!imageClass.loadAsync) {
        return;
    }
    const originalLoadAsync = imageClass.loadAsync.bind(imageClass);
    imageClass.loadAsync = ((source, options) => {
        const description = describeSource(source);
        const imageUrl = typeof source === 'string' ? source : typeof source === 'object' && source.uri ? source.uri : undefined;
        return traceAsyncOperation({
            op: 'resource.image.load',
            name: `Image load ${description}`,
            attributes: Object.assign({ 'sentry.origin': SPAN_ORIGIN_AUTO_RESOURCE_EXPO_IMAGE }, (imageUrl ? { 'image.url': sanitizeUrl(imageUrl) } : undefined)),
        }, () => originalLoadAsync(source, options));
    });
}
function describeSource(source) {
    if (typeof source === 'number') {
        return `asset #${source}`;
    }
    if (typeof source === 'string') {
        return describeUrl(source);
    }
    if (source.uri) {
        return describeUrl(source.uri);
    }
    return 'unknown source';
}
//# sourceMappingURL=expoImage.js.map