import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri dev server conventions: fixed port, strictHostNames for mobile targets.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Workspace UI package ships raw TS/CSS (main: src/index.ts) — never
  // pre-bundle it, let Vite transform it as source.
  optimizeDeps: { exclude: ['@eagle/tauri-ui-plugin'] },
  build: {
    // Tauri expects the frontend at src-tauri's frontendDist (../dist).
    outDir: 'dist',
    target: 'es2022',
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
  },
});
