/**
 * Expo dev-client entry: GlitchTip/Sentry crash reporting + the RN head.
 *
 * DSN comes from EXPO_PUBLIC_SENTRY_DSN (baked at build time by EAS):
 *   EXPO_PUBLIC_SENTRY_DSN=https://key@your-glitchtip/1 \
 *     pnpm --filter @eagle/mobile apk
 * Without a DSN the SDK is a no-op — app runs exactly as before.
 */
import * as Sentry from '@sentry/react-native';
import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import { EagleApp } from '@eagle/rn-ui-plugin';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    // GlitchTip is protocol-compatible with Sentry; send minimal PII.
    sendDefaultPii: false,
    attachScreenshot: false,
    environment: __DEV__ ? 'development' : 'production',
    // Native crashes (most likely cause of launch crash) are captured by
    // the native SDK on next launch; JS errors captured immediately.
    enableNative: true,
    // Keep boot resilient: never block startup on crash reporting.
    enableAutoSessionTracking: true,
  });
  // Expose for rn-ui-plugin's bootTrace breadcrumbs (no import cycle).
  (globalThis as { __EAGLE_SENTRY__?: unknown }).__EAGLE_SENTRY__ = Sentry;
}

function Root(): React.JSX.Element {
  return createElement(EagleApp);
}

// Sentry.wrap catches render-phase errors and forwards unhandled rejections.
registerRootComponent(DSN ? Sentry.wrap(Root) : Root);
