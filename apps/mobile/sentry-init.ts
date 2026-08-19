/**
 * MUST be the first import in index.ts — initializes Sentry before any other
 * module (react-native-video, expo, eagle packages) evaluates, maximizing the
 * capture window for import-time crashes.
 *
 * The native sentry libs are autolinked (libsentry.so ships in the APK), so
 * enableNative gives us native crash capture with zero build-time plugins.
 */
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: __DEV__ ? 'development' : 'production',
    // Native libs are autolinked into the APK — enable native crash capture.
    enableNative: true,
    enableNativeNagger: false,
    enableAutoSessionTracking: true,
  });
  // Delivery canary: if this message reaches GlitchTip but the crash doesn't,
  // the crash happens before JS init; if neither arrives, delivery is broken.
  Sentry.captureMessage('app process started (canary)');
  (globalThis as { __EAGLE_SENTRY__?: unknown }).__EAGLE_SENTRY__ = Sentry;
} else {
  console.warn('[eagle] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
}
