/**
 * Expo dev-client entry. Import order matters: sentry-init runs before any
 * other module evaluates so import-time crashes are within capture range.
 */
import './sentry-init';
import * as Sentry from '@sentry/react-native';
import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import { EagleApp } from '@eagle/rn-ui-plugin';

function Root(): React.JSX.Element {
  return createElement(EagleApp);
}

// Sentry.wrap catches render-phase errors and unhandled rejections.
registerRootComponent(Sentry.wrap(Root));
