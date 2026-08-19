/** FNV-1a 32-bit — tiny, dependency-free, good enough for channel ids. */
export function fnv1a(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36);
}
/** Port implementation for tests: canned responses + deterministic ids. */
export class MemoryPort {
    nowMs = 1_700_000_000_000;
    calls = [];
    text = new Map();
    json = new Map();
    posted = new Map();
    /** Records POST bodies for assertions. */
    postCalls = [];
    postJson = (url, body) => {
        this.postCalls.push({ url, body });
        const hit = this.posted.get(url);
        if (hit === undefined)
            return Promise.reject(new Error(`MemoryPort: no post mock for ${url}`));
        return Promise.resolve(hit);
    };
    getText = (url) => {
        this.calls.push(`GET:text ${url}`);
        const hit = this.text.get(url);
        if (hit instanceof Error)
            return Promise.reject(hit);
        if (hit === undefined)
            return Promise.reject(new Error(`MemoryPort: no text mock for ${url}`));
        return Promise.resolve(typeof hit === 'function' ? hit() : hit);
    };
    getJson = (url) => {
        this.calls.push(`GET:json ${url}`);
        const hit = this.json.get(url);
        if (hit === undefined)
            return Promise.reject(new Error(`MemoryPort: no json mock for ${url}`));
        return Promise.resolve(hit);
    };
    now = () => this.nowMs;
    hash = (input) => fnv1a(input);
    stubText(url, body) {
        this.text.set(url, body);
        return this;
    }
    stubJson(url, body) {
        this.json.set(url, body);
        return this;
    }
    stubPost(url, body) {
        this.posted.set(url, body);
        return this;
    }
}
//# sourceMappingURL=port-memory.js.map