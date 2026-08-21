import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';

const pkgs = (name: string): string =>
  resolve(import.meta.dirname, '..', name, 'src', 'index.ts');

// Tauri dev server conventions: fixed port, strictHostNames for mobile targets.
const host = process.env.TAURI_DEV_HOST;

// CORS/mixed-content escape hatch for pure-browser dev: IPTV origins rarely
// send Access-Control-Allow-Origin, so direct fetches from the page are
// blocked. platform.ts rewrites external URLs to /eagle-proxy/… and this
// middleware forwards them Node-side (no CORS there).
function eagleProxy(): Plugin {
  const PREFIX = '/eagle-proxy/';
  return {
    name: 'eagle-cors-proxy',
    configureServer(server) {
      server.middlewares.use(PREFIX, (req, res, next) => {
        // connect already decodes the path: req.url is "/https://…". Clients
        // may still percent-encode (legacy encodeURIComponent form) — decode
        // best-effort; raw URLs pass through unchanged.
        let raw = req.url?.slice(1) ?? '';
        try {
          raw = decodeURIComponent(raw);
        } catch {
          /* malformed % sequence — use as-is */
        }
        const target = raw;
        if (!/^https?:\/\//i.test(target)) {
          res.statusCode = 400;
          res.end('eagle-proxy: absolute http(s) URL required');
          return;
        }
        // CORS preflight for proxied POSTs with custom headers.
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization, X-Emby-Authorization, Range',
          );
          res.setHeader('Access-Control-Max-Age', '86400');
          res.end();
          return;
        }
        void (async () => {
          try {
            // Forward body + meaningful headers (Content-Type, auth headers
            // like X-Emby-Authorization) — POST logins (Jellyfin) need them.
            const body = await new Promise<Buffer | null>((resolve) => {
              const chunks: Buffer[] = [];
              req.on('data', (c: Buffer) => chunks.push(c));
              req.on('end', () => resolve(Buffer.concat(chunks)));
              req.on('error', () => resolve(null));
            });
            const fwd: Record<string, string> = {
              'User-Agent': 'Eagle/0.1',
              Accept: req.headers.accept ?? '*/*',
            };
            for (const h of ['content-type', 'x-emby-authorization', 'authorization', 'range']) {
              const v = req.headers[h];
              if (typeof v === 'string') fwd[h] = v;
            }
            const upstream = await fetch(target, {
              method: req.method,
              headers: fwd,
              body: body && body.length > 0 && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
              redirect: 'follow',
            });
            const cache = upstream.headers.get('cache-control');
            res.statusCode = upstream.status;
            // Forward media-critical response headers: Content-Range /
            // Accept-Ranges are REQUIRED for <video> seeking and 206 handling.
            for (const h of [
              'content-type',
              'content-length',
              'content-range',
              'accept-ranges',
              'cache-control',
              'etag',
              'last-modified',
            ]) {
              const v = upstream.headers.get(h);
              if (v) res.setHeader(h, v);
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (!upstream.body) {
              res.end();
              return;
            }
            // Stream through — never buffer (files can be gigabytes).
            Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream).pipe(res);
          } catch (e) {
            const cause = e instanceof Error && 'cause' in e ? ` (${String((e as { cause?: unknown }).cause)})` : '';
            console.error(`[eagle-proxy] ${target} failed:`, e instanceof Error ? e.message : e, cause);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`eagle-proxy: upstream failed — ${e instanceof Error ? e.message : String(e)}`);
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), eagleProxy()],
  // RN-ecosystem packages expect Node globals; map them for the browser.
  define: {
    global: 'globalThis',
  },
  resolve: {
    // Single React copy (hoisted layouts can otherwise mix versions → boot crash).
    dedupe: ['react', 'react-dom', 'react-native'],
    // Desktop renders the shared RN-syntax screens through react-native-web.
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      // safe-area-context's RN entry pulls flow-syntax codegen internals;
      // alias to our pure-JS shim (compat provider + zero insets).
      {
        find: /^react-native-safe-area-context$/,
        replacement: resolve(import.meta.dirname, 'src', 'safe-area-web.tsx'),
      },
      // Workspace packages ship stale `lib/` builds under `main`; alias to TS
      // sources (mirrors metro's `react-native` field) so lib never bites.
      { find: /^@eagle\/core$/, replacement: pkgs('core') },
      { find: /^@eagle\/jellyfin-plugin$/, replacement: pkgs('jellyfin-plugin') },
      { find: /^@eagle\/jellyfin-video-plugin$/, replacement: pkgs('jellyfin-video-plugin') },
      { find: /^@eagle\/m3u-tuner-plugin$/, replacement: pkgs('m3u-tuner-plugin') },
      { find: /^@eagle\/hdhome-run-plugin$/, replacement: pkgs('hdhome-run-plugin') },
      { find: /^@eagle\/ui-screens$/, replacement: pkgs('ui-screens') },
    ],
    // Platform forks: .web.tsx wins over .native.tsx / .tsx.
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js', '.jsx'],
  },
  optimizeDeps: {
    // Workspace packages + safe-area (its RN entry hits flow-syntax sources
    // when pre-bundled; its dist/web implementation resolves fine unbundled).
    exclude: [
      '@eagle/ui-screens',
      '@eagle/core',
      '@eagle/jellyfin-plugin',
      '@eagle/jellyfin-video-plugin',
      '@eagle/m3u-tuner-plugin',
      '@eagle/hdhome-run-plugin',
    ],
    include: ['react-native-web', 'hls.js'],
  },
  build: {
    // Tauri expects the frontend at src-tauri's frontendDist (../dist).
    outDir: 'dist',
    target: 'es2022',
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // LAN dev by default; tunnel hosts (*.port.dsh.onemue.cn) allowed via
    // dot-prefix (matches the whole subtree).
    host: host || true,
    allowedHosts: ['.port.dsh.onemue.cn'],
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
  },
});
