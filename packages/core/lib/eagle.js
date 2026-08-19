import { CoreError } from './types.js';
const SOURCES_KEY = 'eagle.sources';
/**
 * Plugin-registry core. Ships with zero concrete sources; hosts register
 * source plugins at bootstrap and everything else (persistence, merging,
 * routing, notifications) is generic.
 */
export class EagleCore {
    port;
    settings;
    plugins = new Map();
    sources = new Map();
    channelCache = new Map();
    listeners = new Set();
    constructor(port, settings) {
        this.port = port;
        this.settings = settings;
    }
    /** Register a source plugin (idempotent by kind). */
    use(plugin) {
        this.plugins.set(plugin.kind, plugin);
        return this;
    }
    /** All registered plugins (settings screens iterate this for "add source"). */
    listPlugins() {
        return [...this.plugins.values()];
    }
    /** Restore previously configured sources from settings. */
    async hydrate() {
        const stored = await this.settings.get(SOURCES_KEY);
        if (!stored)
            return;
        for (const s of stored) {
            const plugin = this.plugins.get(s.kind);
            if (!plugin)
                continue; // plugin not registered (uninstalled?) — skip
            try {
                const source = plugin.create(this.port, s.connection);
                this.sources.set(s.connection.id, { plugin, source });
            }
            catch {
                // Skip broken persisted entries rather than failing boot.
            }
        }
        this.emit();
    }
    listSources() {
        return [...this.sources.values()].map(({ plugin, source }) => ({
            id: source.sourceId,
            kind: plugin.kind,
            label: source.sourceId,
        }));
    }
    /** Add a source via its plugin: connect → persist → mount. */
    async addSource(kind, input) {
        const plugin = this.plugins.get(kind);
        if (!plugin)
            throw new CoreError('UNSUPPORTED', `No source plugin registered for "${kind}"`);
        const connection = await plugin.connect(this.port, input);
        const stored = await this.readStored();
        const next = [...stored.filter((s) => s.connection.id !== connection.id), { kind, connection }];
        await this.settings.set(SOURCES_KEY, next);
        const source = plugin.create(this.port, connection);
        this.sources.set(connection.id, { plugin, source });
        this.emit();
        return { id: connection.id, kind: plugin.kind, label: connection.label };
    }
    async removeSource(id) {
        const stored = await this.readStored();
        await this.settings.set(SOURCES_KEY, stored.filter((s) => s.connection.id !== id));
        this.sources.delete(id);
        this.channelCache.delete(id);
        this.emit();
    }
    /** Merged channel list across all attached sources. */
    async listChannels() {
        const out = [];
        for (const { source } of this.sources.values()) {
            const cached = this.channelCache.get(source.sourceId);
            if (cached) {
                out.push(...cached);
                continue;
            }
            try {
                const page = await source.listChannels();
                this.channelCache.set(source.sourceId, page.channels);
                out.push(...page.channels);
            }
            catch {
                // A failing source must not break the whole channel list (MVP: skip).
            }
        }
        return out;
    }
    /** Invalidate cached channel lists (pull-to-refresh). */
    invalidateChannels() {
        this.channelCache.clear();
        this.emit();
    }
    async resolveStream(channelId) {
        const entry = this.route(channelId);
        return entry.source.resolveStream(channelId);
    }
    async searchChannels(query) {
        const q = query.trim().toLowerCase();
        if (!q)
            return [];
        const all = await this.listChannels();
        return all.filter((c) => c.name.toLowerCase().includes(q));
    }
    /** Fire-and-forget refresh trigger for UI stores. */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /** Look up the LiveSource handling a channel id by plugin prefix. */
    route(channelId) {
        const hit = [...this.sources.values()].find(({ plugin }) => channelId.startsWith(`${plugin.channelIdPrefix}:`));
        if (!hit)
            throw new CoreError('NOT_FOUND', `No source handles channel ${channelId}`);
        return hit;
    }
    async readStored() {
        return (await this.settings.get(SOURCES_KEY)) ?? [];
    }
    emit() {
        for (const l of this.listeners)
            l();
    }
}
//# sourceMappingURL=eagle.js.map