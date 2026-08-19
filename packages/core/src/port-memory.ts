import type { Port } from './types.js';

/** FNV-1a 32-bit — tiny, dependency-free, good enough for channel ids. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** Port implementation for tests: canned responses + deterministic ids. */
export class MemoryPort implements Port {
  nowMs = 1_700_000_000_000;
  readonly calls: string[] = [];

  private text = new Map<string, string | (() => string) | Error>();
  private json = new Map<string, unknown>();
  private posted = new Map<string, unknown>();

  /** Records POST bodies for assertions. */
  readonly postCalls: { url: string; body: unknown }[] = [];

  postJson = <T>(url: string, body: unknown): Promise<T> => {
    this.postCalls.push({ url, body });
    const hit = this.posted.get(url);
    if (hit === undefined) return Promise.reject(new Error(`MemoryPort: no post mock for ${url}`));
    return Promise.resolve(hit as T);
  };

  getText = (url: string): Promise<string> => {
    this.calls.push(`GET:text ${url}`);
    const hit = this.text.get(url);
    if (hit instanceof Error) return Promise.reject(hit);
    if (hit === undefined) return Promise.reject(new Error(`MemoryPort: no text mock for ${url}`));
    return Promise.resolve(typeof hit === 'function' ? hit() : hit);
  };

  getJson = <T>(url: string): Promise<T> => {
    this.calls.push(`GET:json ${url}`);
    const hit = this.json.get(url);
    if (hit === undefined) return Promise.reject(new Error(`MemoryPort: no json mock for ${url}`));
    return Promise.resolve(hit as T);
  };

  now = (): number => this.nowMs;
  hash = (input: string): string => fnv1a(input);

  stubText(url: string, body: string | (() => string) | Error): this {
    this.text.set(url, body);
    return this;
  }
  stubJson(url: string, body: unknown): this {
    this.json.set(url, body);
    return this;
  }
  stubPost(url: string, body: unknown): this {
    this.posted.set(url, body);
    return this;
  }
}
