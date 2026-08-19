import { CoreError } from './types.js';
import { fnv1a } from './port-memory.js';
/** AbortSignal.timeout is not available in older Hermes/RN runtimes. */
function timeoutSignal(ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}
export class FetchPort {
    fetchLike;
    constructor(fetchLike) {
        this.fetchLike = fetchLike;
    }
    now() {
        return Date.now();
    }
    hash(input) {
        return fnv1a(input);
    }
    async getText(url, init) {
        const res = await this.doFetch(url, init);
        if (!res.ok)
            throw new CoreError('NETWORK', `GET ${url} failed: ${res.status}`);
        return res.text();
    }
    async getJson(url, init) {
        const res = await this.doFetch(url, init);
        if (!res.ok)
            throw new CoreError('NETWORK', `GET ${url} failed: ${res.status}`);
        return res.json();
    }
    async postJson(url, body, init) {
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
            return res.json();
        }
        catch (e) {
            if (e instanceof CoreError)
                throw e;
            throw new CoreError('NETWORK', `POST ${url} network error`, e);
        }
        finally {
            cancel();
        }
    }
    async doFetch(url, init) {
        const { signal, cancel } = timeoutSignal(init?.timeoutMs ?? 10_000);
        try {
            return await this.fetchLike.fetch(url, { ...init, method: 'GET', signal });
        }
        catch (e) {
            throw new CoreError('NETWORK', `GET ${url} network error`, e);
        }
        finally {
            cancel();
        }
    }
}
//# sourceMappingURL=port-fetch.js.map