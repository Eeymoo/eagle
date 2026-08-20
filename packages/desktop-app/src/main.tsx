/**
 * Desktop shell entry — mounts the Tauri pure head and nothing else.
 * All behavior lives in @eagle/headless-ui via @eagle/tauri-ui-plugin.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { EagleTauriApp } from '@eagle/tauri-ui-plugin';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EagleTauriApp />
  </React.StrictMode>,
);
