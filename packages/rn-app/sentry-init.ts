/**
 * MUST be the first import in index.ts — runs before any other module
 * (react-native-video, expo, eagle packages) evaluates.
 *
 * 1. Installs the `performance` global if missing. RN's createPerformanceLogger
 *    evaluates `global.performance.now()` at module top level, and in this
 *    bundle's load order AppRegistry loads BEFORE the renderer pulls in
 *    InitializeCore/setUpPerformance — so the global isn't there yet →
 *    `TypeError: Cannot read property 'now' of undefined` (the black screen).
 * 2. Initializes Sentry (crash reporting to GlitchTip).
 *
 * NOTE: we import from '@sentry/react-native/dist/js/sdk' (the internal
 * module), NOT the package root — the root index unconditionally re-exports
 * FeedbackWidget, whose eval chain touches browser-only APIs before RN's
 * polyfills exist, crashing the app at startup.
 */

// --- performance global guard (before ANY other module evaluates) ---
type PerfLike = { now(): number; mark?(): void; measure?(): void };
const g = globalThis as unknown as { performance?: PerfLike; nativePerformanceNow?: () => number };
if (typeof g.performance === 'undefined') {
  g.performance = {
    now: () => (g.nativePerformanceNow ?? Date.now)(),
    mark: () => {},
    measure: () => {},
  };
}

import * as Sentry from '@sentry/react-native/dist/js/sdk';
import { captureMessage, addBreadcrumb } from '@sentry/core';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: __DEV__ ? 'development' : 'production',
    // Native sentry libs are autolinked (libsentry.so ships in the APK):
    // enableNative gives us native crash capture with zero build-time plugins.
    enableNative: true,
    enableNativeNagger: false,
    enableAutoSessionTracking: true,
  });
  // Delivery canary: if this reaches GlitchTip but a crash doesn't, the crash
  // happens before JS init; if neither arrives, delivery itself is broken.
  captureMessage('app process started (canary)');
  (globalThis as { __EAGLE_SENTRY__?: unknown }).__EAGLE_SENTRY__ = { captureMessage, addBreadcrumb };
} else {
  console.warn('[eagle] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
}
