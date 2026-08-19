import { LiveSourceBase } from '../source.js';
import { CoreError } from '../types.js';
const DEFAULT_PORTS = [80];
function normalizeBase(baseUrl) {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(trimmed))
        return `http://${trimmed}`;
    return trimmed;
}
/** Fetch and validate /discover.json for a candidate device URL. */
export async function discoverDevice(port, baseUrl) {
    const base = normalizeBase(baseUrl);
    try {
        const device = await port.getJson(`${base}/discover.json`, { timeoutMs: 5_000 });
        if (!device?.BaseURL)
            throw new CoreError('PARSE', 'HDHomeRun: /discover.json missing BaseURL');
        return { ...device, BaseURL: normalizeBase(device.BaseURL || base) };
    }
    catch (e) {
        if (e instanceof CoreError && e.code === 'PARSE')
            throw e;
        throw new CoreError('NOT_FOUND', `HDHomeRun: no device at ${base}`, e);
    }
}
export class HDHomeRunSource extends LiveSourceBase {
    port;
    device;
    kind = 'hdhomerun';
    sourceId;
    cache;
    constructor(port, device, sourceId = 'hdhomerun') {
        super();
        this.port = port;
        this.device = device;
        this.sourceId = sourceId;
    }
    base() {
        return normalizeBase(this.device.BaseURL ?? '');
    }
    lineupUrl() {
        return this.device.LineupURL || `${this.base()}/lineup.json`;
    }
    async listChannels(opts) {
        if (!opts?.force && this.cache)
            return { channels: this.cache.channels, nextCursor: undefined };
        let lineup;
        try {
            lineup = await this.port.getJson(this.lineupUrl(), { timeoutMs: 10_000 });
        }
        catch (e) {
            throw e instanceof CoreError
                ? e
                : new CoreError('NETWORK', `HDHomeRun: failed to fetch lineup at ${this.lineupUrl()}`, e);
        }
        const channels = [];
        const urlByNumber = new Map();
        for (const c of lineup) {
            if (!c.GuideNumber || !c.URL)
                continue;
            urlByNumber.set(c.GuideNumber, c.URL);
            channels.push({
                id: `hdhr:${c.GuideNumber}`,
                source: 'hdhomerun',
                name: c.GuideName || c.GuideNumber,
                number: c.GuideNumber,
                group: c.HD ? 'HD' : undefined,
            });
        }
        this.cache = { channels, urlByNumber };
        return { channels, nextCursor: undefined };
    }
    async resolveStream(channelId) {
        if (!this.cache)
            await this.listChannels();
        const bare = channelId.replace(/^hdhr:/, '');
        const url = this.cache?.urlByNumber.get(bare);
        if (!url)
            throw new CoreError('NOT_FOUND', `HDHomeRun: channel ${channelId} not in lineup`);
        return { url, kind: 'hdhomerun', containerHint: 'ts' };
    }
}
//# sourceMappingURL=hdhomerun.js.map