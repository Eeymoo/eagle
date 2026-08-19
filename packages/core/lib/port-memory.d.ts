import type { Port } from './types.js';
/** FNV-1a 32-bit — tiny, dependency-free, good enough for channel ids. */
export declare function fnv1a(input: string): string;
/** Port implementation for tests: canned responses + deterministic ids. */
export declare class MemoryPort implements Port {
    nowMs: number;
    readonly calls: string[];
    private text;
    private json;
    private posted;
    /** Records POST bodies for assertions. */
    readonly postCalls: {
        url: string;
        body: unknown;
    }[];
    postJson: <T>(url: string, body: unknown) => Promise<T>;
    getText: (url: string) => Promise<string>;
    getJson: <T>(url: string) => Promise<T>;
    now: () => number;
    hash: (input: string) => string;
    stubText(url: string, body: string | (() => string) | Error): this;
    stubJson(url: string, body: unknown): this;
    stubPost(url: string, body: unknown): this;
}
//# sourceMappingURL=port-memory.d.ts.map