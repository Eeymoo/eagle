/**
 * Eagle → React Native platform bridge.
 *
 * Implements the core `Port`/`SettingsStore` capabilities on top of RN
 * primitives: global fetch for HTTP, AsyncStorage-backed settings, Date.now
 * and fnv1a for ids. This is the ONLY file allowed to import react-native.
 */
import { MemorySettingsStore } from '@eagle/core';
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

/** Port over RN's global fetch (whatwg-fetch polyfill on RN). */
export class ReactNativePort implements Port {
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
    const res = await this.doFetch(url, { ...init, method: 'GET' });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.text();
  }

  async getJson<T>(url: string, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<T> {
    const res = await this.doFetch(url, { ...init, method: 'GET' });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async postJson<T>(url: string, body: unknown, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<T> {
    const res = await this.doFetch(url, {
      ...init,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
}

/** Lazily-imported AsyncStorage-backed SettingsStore (lazy to keep this module testable in Node). */
export async function createSettingsStore(): Promise<SettingsStore> {
  const mod = await import('@react-native-async-storage/async-storage');
  const storage = mod.default;
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const raw = await storage.getItem(key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T): Promise<void> {
      await storage.setItem(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      await storage.removeItem(key);
    },
  };
}

export { MemorySettingsStore };
