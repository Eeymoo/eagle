/**
 * Expo dev-client entry. Import order matters: sentry-init runs before any
 * other module evaluates so import-time crashes are within capture range.
 *
 * NOTE: deliberately NOT using Sentry.wrap() — it pulls in the FeedbackWidget
 * whose module top-level runs `new FormData(e.target)` (browser-only API) at
 * eval time, before RN's FormData polyfill is injected → startup crash.
 * Error capture is handled inside sentry-init via default integrations.
 */
import './sentry-init';
import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import { EagleApp } from '@eagle/rn-ui-plugin';

function Root(): React.JSX.Element {
  return createElement(EagleApp);
}

registerRootComponent(Root);
