/**
 * Eagle → Tauri (WebView/DOM) platform bridge.
 *
 * Implements the core `Port`/`SettingsStore` capabilities on top of web
 * primitives available inside the Tauri WebView: global fetch for HTTP,
 * localStorage-backed settings, Date.now and fnv1a for ids. This is the
 * ONLY file in the desktop shell allowed to touch storage primitives.
 */
import type { Port, SettingsStore } from '@eagle/core';

/** FNV-1a 32-bit, mirroring core's port-memory implementation. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Browser-dev CORS escape hatch.
 *
 * IPTV origins rarely send Access-Control-Allow-Origin, so plain-browser dev
 * (vite, no Tauri shell) has every fetch blocked. We rewrite absolute URLs
 * to the vite dev server's /eagle-proxy/ route which forwards Node-side.
 * Inside the Tauri WebView URLs pass through untouched.
 */
const isPlainBrowserDev: boolean =
  typeof window !== 'undefined' &&
  !('__TAURI_INTERNALS__' in window) &&
  /^(localhost|127\.0\.0\.1|192\.168\.)/.test(window.location?.hostname ?? '');

export function eagleUrl(url: string): string {
  if (!isPlainBrowserDev || !/^https?:\/\//i.test(url)) return url;
  return `/eagle-proxy/${encodeURIComponent(url)}`;
}

/** Port over the WebView's global fetch (tauri-plugin-http when enabled). */
export class TauriPort implements Port {
  now(): number {
    return Date.now();
  }

  hash(input: string): string {
    return fnv1a(input);
  }

  private async doFetch(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 10_000);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async getText(url: string, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<string> {
    const res = await this.doFetch(eagleUrl(url), { ...init, method: 'GET' });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.text();
  }

  async getJson<T>(url: string, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<T> {
    const res = await this.doFetch(eagleUrl(url), { ...init, method: 'GET' });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async postJson<T>(url: string, body: unknown, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<T> {
    const res = await this.doFetch(eagleUrl(url), {
      ...init,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
}

/** localStorage-backed SettingsStore (survives WebView restarts in Tauri). */
export function createSettingsStore(): SettingsStore {
  const key = (k: string): string => `eagle:${k}`;
  return {
    async get<T>(k: string): Promise<T | undefined> {
      const raw = globalThis.localStorage?.getItem(key(k));
      return raw === null || raw === undefined ? undefined : (JSON.parse(raw) as T);
    },
    async set<T>(k: string, value: T): Promise<void> {
      globalThis.localStorage?.setItem(key(k), JSON.stringify(value));
    },
    async remove(k: string): Promise<void> {
      globalThis.localStorage?.removeItem(key(k));
    },
  };
}
