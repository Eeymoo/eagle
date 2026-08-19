/**
 * MUST be the first import in index.ts — initializes Sentry before any other
 * module (react-native-video, expo, eagle packages) evaluates, maximizing the
 * capture window for import-time crashes.
 *
 * IMPORTANT: we import from '@sentry/react-native/dist/js/sdk' (the internal
 * module), NOT the package root. The root index unconditionally re-exports
 * FeedbackWidget, whose module eval chain (via @sentry/react →
 * @sentry/browser feedback) touches browser-only APIs — before RN's polyfills
 * exist — crashing the app on startup.
 */
import * as Sentry from '@sentry/react-native/dist/js/sdk';
import { captureMessage, addBreadcrumb } from '@sentry/core';

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
  captureMessage('app process started (canary)');
  (globalThis as { __EAGLE_SENTRY__?: unknown }).__EAGLE_SENTRY__ = { captureMessage, addBreadcrumb };
} else {
  console.warn('[eagle] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
}
