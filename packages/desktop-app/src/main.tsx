/**
 * Desktop shell entry — mounts the Tauri head over @eagle/ui-screens.
 * Screens render through react-native-web (vite alias react-native → RNW).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { EagleDesktopApp } from './App.js';
import '@eagle/design-tokens/css';

// No StrictMode: its dev double-invocation desyncs react-router 7's data
// router under React 19.1 — RouterProvider stops re-rendering on navigate
// (URL changes, view doesn't). Re-evaluate on react-router upgrades.
createRoot(document.getElementById('root')!, {
  onUncaughtError: (err) => {
    // eslint-disable-next-line no-console
    console.error('[uncaught]', err instanceof Error ? err.stack ?? err.message : String(err));
  },
}).render(<EagleDesktopApp />);
