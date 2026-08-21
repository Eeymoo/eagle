/**
 * Desktop shell entry — mounts the Tauri head over @eagle/ui-screens.
 * Screens render through react-native-web (vite alias react-native → RNW).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { EagleDesktopApp } from './App.js';
import '@eagle/design-tokens/css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EagleDesktopApp />
  </React.StrictMode>,
);
