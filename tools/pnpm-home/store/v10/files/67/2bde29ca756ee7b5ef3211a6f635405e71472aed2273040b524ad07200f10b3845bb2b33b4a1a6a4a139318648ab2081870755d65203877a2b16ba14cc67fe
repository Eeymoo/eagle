import { debug } from '@sentry/core';
import { NativeEventEmitter } from 'react-native';
import { isWeb } from '../utils/environment';
import { getRNSentryModule } from '../wrapper';
export const OnShakeEventName = 'rn_sentry_on_shake';
let _shakeSubscription = null;
const defaultEmitterFactory = nativeModule => new NativeEventEmitter(nativeModule);
/**
 * Starts listening for device shake events and invokes the provided callback when a shake is detected.
 *
 * This starts native shake detection:
 * - iOS: Uses UIKit's motion event detection (no permissions required)
 * - Android: Uses the accelerometer sensor (no permissions required)
 */
export function startShakeListener(onShake, createEmitter = defaultEmitterFactory) {
    if (_shakeSubscription) {
        return false;
    }
    if (isWeb()) {
        debug.warn('Shake detection is not supported on Web.');
        return false;
    }
    const nativeModule = getRNSentryModule();
    if (!nativeModule) {
        debug.warn('Native module is not available. Shake detection will not work.');
        return false;
    }
    try {
        const emitter = createEmitter(nativeModule);
        _shakeSubscription = emitter.addListener(OnShakeEventName, () => {
            onShake();
        });
        // Explicitly enable native shake detection. On iOS with New Architecture (TurboModules),
        // NativeEventEmitter.addListener does not dispatch to native addListener:, so the
        // native shake listener would never start without this explicit call.
        const module = nativeModule;
        if (module.enableShakeDetection) {
            module.enableShakeDetection();
        }
        else {
            debug.warn('enableShakeDetection is not available on the native module.');
        }
        return true;
    }
    catch (e) {
        debug.warn('Failed to start shake listener:', e);
        if (_shakeSubscription) {
            _shakeSubscription.remove();
            _shakeSubscription = null;
        }
        return false;
    }
}
/**
 * Stops listening for device shake events.
 */
export function stopShakeListener() {
    var _a;
    if (_shakeSubscription) {
        try {
            _shakeSubscription.remove();
        }
        catch (e) {
            debug.warn('Failed to remove shake subscription:', e);
        }
        _shakeSubscription = null;
        try {
            const nativeModule = getRNSentryModule();
            (_a = nativeModule === null || nativeModule === void 0 ? void 0 : nativeModule.disableShakeDetection) === null || _a === void 0 ? void 0 : _a.call(nativeModule);
        }
        catch (e) {
            debug.warn('Failed to disable native shake detection:', e);
        }
    }
}
/**
 * Returns whether the shake listener is currently active.
 * Exported for testing purposes.
 */
export function isShakeListenerActive() {
    return _shakeSubscription !== null;
}
//# sourceMappingURL=ShakeToReportBug.js.map