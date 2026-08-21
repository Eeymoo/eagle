/**
 * Internal interface for expo-image's ImageSource.
 * We define this to avoid a hard dependency on expo-image.
 */
interface ExpoImageSource {
    uri?: string;
    headers?: Record<string, string>;
    width?: number | null;
    height?: number | null;
    cacheKey?: string;
}
/**
 * Internal interface for expo-image's ImageLoadOptions.
 * We define this to avoid a hard dependency on expo-image.
 */
interface ExpoImageLoadOptions {
    maxWidth?: number;
    maxHeight?: number;
    onError?(error: Error, retry: () => void): void;
}
/**
 * Internal interface for expo-image's ImageRef.
 * We define this to avoid a hard dependency on expo-image.
 */
interface ExpoImageRef {
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    readonly mediaType: string | null;
    readonly isAnimated?: boolean;
}
/**
 * Represents the expo-image `Image` class with its static methods.
 * We only describe the methods that we instrument.
 */
export interface ExpoImage {
    prefetch(urls: string | string[], cachePolicyOrOptions?: any): Promise<boolean>;
    loadAsync(source: ExpoImageSource | string | number, options?: ExpoImageLoadOptions): Promise<ExpoImageRef>;
    clearMemoryCache?(): Promise<boolean>;
    clearDiskCache?(): Promise<boolean>;
}
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
export declare function wrapExpoImage<T extends ExpoImage>(imageClass: T): T;
export {};
//# sourceMappingURL=expoImage.d.ts.map
