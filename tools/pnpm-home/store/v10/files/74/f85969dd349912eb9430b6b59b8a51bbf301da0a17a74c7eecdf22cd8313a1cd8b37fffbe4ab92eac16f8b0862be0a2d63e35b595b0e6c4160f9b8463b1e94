import { SPAN_ORIGIN_AUTO_RESOURCE_EXPO_ASSET } from './origin';
import { describeUrl, traceAsyncOperation } from './utils';
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
export function wrapExpoAsset(assetClass) {
    if (!assetClass) {
        return assetClass;
    }
    if (assetClass.__sentryWrapped) {
        return assetClass;
    }
    wrapLoadAsync(assetClass);
    assetClass.__sentryWrapped = true;
    return assetClass;
}
function wrapLoadAsync(assetClass) {
    if (!assetClass.loadAsync) {
        return;
    }
    const originalLoadAsync = assetClass.loadAsync.bind(assetClass);
    assetClass.loadAsync = ((moduleId) => {
        const moduleIds = Array.isArray(moduleId) ? moduleId : [moduleId];
        const assetCount = moduleIds.length;
        const description = describeModuleIds(moduleIds);
        return traceAsyncOperation({
            op: 'resource.asset',
            name: `Asset load ${description}`,
            attributes: {
                'sentry.origin': SPAN_ORIGIN_AUTO_RESOURCE_EXPO_ASSET,
                'asset.count': assetCount,
            },
        }, () => originalLoadAsync(moduleId));
    });
}
function describeModuleIds(moduleIds) {
    if (moduleIds.length === 1) {
        const id = moduleIds[0];
        if (typeof id === 'string') {
            return describeUrl(id);
        }
        return `asset #${id}`;
    }
    return `${moduleIds.length} assets`;
}
//# sourceMappingURL=expoAsset.js.map