import type { HttpInit, Port } from './types.js';
import { CoreError } from './types.js';
import { fnv1a } from './port-memory.js';

/**
 * Minimal `fetch`-shaped transport injected by the UI plugin. Only the small
 * surface core needs (GET text/json + timeout) is required, so both React Native
 * and Tauri can supply it trivially.
 */
export interface FetchLike {
  fetch(
    url: string,
    init?: HttpInit & { method?: 'GET' | 'POST'; signal?: AbortSignal; body?: string },
  ): Promise<Response>;
}

/** AbortSignal.timeout is not available in older Hermes/RN runtimes. */
function timeoutSignal(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

export class FetchPort implements Port {
  constructor(private readonly fetchLike: FetchLike) {}

  now(): number {
    return Date.now();
  }

  hash(input: string): string {
    return fnv1a(input);
  }

  async getText(url: string, init?: HttpInit): Promise<string> {
    const res = await this.doFetch(url, init);
    if (!res.ok) throw new CoreError('NETWORK', `GET ${url} failed: ${res.status}`);
    return res.text();
  }

  async getJson<T>(url: string, init?: HttpInit): Promise<T> {
    const res = await this.doFetch(url, init);
    if (!res.ok) throw new CoreError('NETWORK', `GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async postJson<T>(url: string, body: unknown, init?: HttpInit): Promise<T> {
    const { signal, cancel } = timeoutSignal(init?.timeoutMs ?? 10_000);
    try {
      const res = await this.fetchLike.fetch(url, {
        ...init,
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new CoreError(res.status === 401 ? 'AUTH_FAILED' : 'NETWORK', `POST ${url} failed: ${res.status}`);
      }
      return res.json() as Promise<T>;
    } catch (e) {
      if (e instanceof CoreError) throw e;
      throw new CoreError('NETWORK', `POST ${url} network error`, e);
    } finally {
      cancel();
    }
  }

  private async doFetch(url: string, init?: HttpInit): Promise<Response> {
    const { signal, cancel } = timeoutSignal(init?.timeoutMs ?? 10_000);
    try {
      return await this.fetchLike.fetch(url, { ...init, method: 'GET', signal });
    } catch (e) {
      throw new CoreError('NETWORK', `GET ${url} network error`, e);
    } finally {
      cancel();
    }
  }
}
