import type { HttpInit, Port } from './types.js';
/**
 * Minimal `fetch`-shaped transport injected by the UI plugin. Only the small
 * surface core needs (GET text/json + timeout) is required, so both React Native
 * and Tauri can supply it trivially.
 */
export interface FetchLike {
    fetch(url: string, init?: HttpInit & {
        method?: 'GET' | 'POST';
        signal?: AbortSignal;
        body?: string;
    }): Promise<Response>;
}
export declare class FetchPort implements Port {
    private readonly fetchLike;
    constructor(fetchLike: FetchLike);
    now(): number;
    hash(input: string): string;
    getText(url: string, init?: HttpInit): Promise<string>;
    getJson<T>(url: string, init?: HttpInit): Promise<T>;
    postJson<T>(url: string, body: unknown, init?: HttpInit): Promise<T>;
    private doFetch;
}
//# sourceMappingURL=port-fetch.d.ts.map