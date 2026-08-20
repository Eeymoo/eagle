import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri dev server conventions: fixed port, strictHostNames for mobile targets.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Hoisted pnpm layouts can resolve react/react-dom to different copies
  // (e.g. react 19.1.0 from rn-app + react-dom 19.2.8) — dedupe forces a
  // single instance or the app crashes at boot (React error #527).
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
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
