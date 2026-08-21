/**
 * Internal interface for expo-asset's Asset instance.
 * We define this to avoid a hard dependency on expo-asset.
 */
export interface ExpoAssetInstance {
    name: string;
    type: string;
    hash: string | null;
    uri: string;
    localUri: string | null;
    width: number | null;
    height: number | null;
    downloaded: boolean;
    downloadAsync(): Promise<ExpoAssetInstance>;
}
/**
 * Represents the expo-asset `Asset` class with its static methods.
 * We only describe the methods that we instrument.
 */
export interface ExpoAsset {
    loadAsync(moduleId: number | number[] | string | string[]): Promise<ExpoAssetInstance[]>;
    fromModule(virtualAssetModule: number | string): ExpoAssetInstance;
}
/**
 * Wraps expo-asset's `Asset` class to add automated performance monitoring.
 *
 * This function instruments `Asset.loadAsync` static method
 * to create performance spans that measure how long asset loading takes.
 *
 * @param assetClass - The `Asset` class from `expo-asset`
 * @returns The same class with instrumented static methods
 *
 * @example
 * ```typescript
 * import { Asset } from 'expo-asset';
 * import * as Sentry from '@sentry/react-native';
 *
 * Sentry.wrapExpoAsset(Asset);
 * ```
 */
export declare function wrapExpoAsset<T extends ExpoAsset>(assetClass: T): T;
//# sourceMappingURL=expoAsset.d.ts.map