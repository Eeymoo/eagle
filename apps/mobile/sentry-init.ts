/**
 * MUST be the first import in index.ts — initializes Sentry before any other
 * module (react-native-video, expo, eagle packages) evaluates, maximizing the
 * capture window for import-time crashes.
 *
 * IMPORTANT: we import from '@sentry/react-native/dist/js/sdk' (the internal
 * module), NOT the package root. The root index unconditionally re-exports
 * FeedbackWidget, whose module top-level runs `new FormData(e.target)`
 * (browser-only API) at eval time — before RN's FormData polyfill exists —
 * crashing the app on startup. The sdk module has no such imports and exposes
 * init / captureMessage / addBreadcrumb: everything we need.
 */
import * as Sentry from '@sentry/react-native/dist/js/sdk';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: __DEV__ ? 'development' : 'production',
    // Native sentry libs are autolinked (libsentry.so ships in the APK):
    // enableNative gives native crash capture with zero build-time plugins.
    enableNative: true,
    enableNativeNagger: false,
    enableAutoSessionTracking: true,
  });
  // Delivery canary: if this reaches GlitchTip but a crash doesn't, the crash
  // happens before JS init; if neither arrives, delivery itself is broken.
  Sentry.captureMessage('app process started (canary)');
  (globalThis as { __EAGLE_SENTRY__?: unknown }).__EAGLE_SENTRY__ = Sentry;
} else {
  console.warn('[eagle] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
}
