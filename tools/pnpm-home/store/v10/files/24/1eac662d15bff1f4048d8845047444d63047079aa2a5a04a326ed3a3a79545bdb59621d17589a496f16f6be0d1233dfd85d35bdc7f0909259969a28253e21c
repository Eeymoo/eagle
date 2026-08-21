import type { NativeModule } from 'react-native';
import { NativeEventEmitter } from 'react-native';
export declare const OnShakeEventName = "rn_sentry_on_shake";
/**
 * Creates a NativeEventEmitter for the given module.
 * Can be overridden in tests via the `createEmitter` parameter.
 */
type EmitterFactory = (nativeModule: NativeModule) => NativeEventEmitter;
/**
 * Starts listening for device shake events and invokes the provided callback when a shake is detected.
 *
 * This starts native shake detection:
 * - iOS: Uses UIKit's motion event detection (no permissions required)
 * - Android: Uses the accelerometer sensor (no permissions required)
 */
export declare function startShakeListener(onShake: () => void, createEmitter?: EmitterFactory): boolean;
/**
 * Stops listening for device shake events.
 */
export declare function stopShakeListener(): void;
/**
 * Returns whether the shake listener is currently active.
 * Exported for testing purposes.
 */
export declare function isShakeListenerActive(): boolean;
export {};
//# sourceMappingURL=ShakeToReportBug.d.ts.map