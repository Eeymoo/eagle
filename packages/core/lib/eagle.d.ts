import type { LiveSource } from './source.js';
import type { SourcePlugin, PluginConfig, PluginConnection } from './plugin.js';
import type { Channel, Port, SettingsStore, SourceRef, StreamUrl } from './types.js';
/** Persisted descriptor for one configured source (re-created on launch). */
export interface StoredSource {
    /** Plugin kind, e.g. 'jellyfin'. */
    kind: string;
    connection: PluginConnection;
}
/**
 * Plugin-registry core. Ships with zero concrete sources; hosts register
 * source plugins at bootstrap and everything else (persistence, merging,
 * routing, notifications) is generic.
 */
export declare class EagleCore {
    private readonly port;
    private readonly settings;
    private plugins;
    private sources;
    private channelCache;
    private listeners;
    constructor(port: Port, settings: SettingsStore);
    /** Register a source plugin (idempotent by kind). */
    use(plugin: SourcePlugin): this;
    /** All registered plugins (settings screens iterate this for "add source"). */
    listPlugins(): SourcePlugin[];
    /** Read-only settings access for heads (feature flags, persisted prefs). */
    get settingsStore(): SettingsStore;
    /** Restore previously configured sources from settings. */
    hydrate(): Promise<void>;
    listSources(): SourceRef[];
    /** Live source instances (heads probe optional capabilities, e.g. libraries). */
    getSources(): LiveSource[];
    /** Add a source via its plugin: connect → persist → mount. */
    addSource(kind: string, input: PluginConfig): Promise<SourceRef>;
    removeSource(id: string): Promise<void>;
    /** Merged channel list across all attached sources. */
    listChannels(): Promise<Channel[]>;
    /** Invalidate cached channel lists (pull-to-refresh). */
    invalidateChannels(): void;
    resolveStream(channelId: string): Promise<StreamUrl>;
    searchChannels(query: string): Promise<Channel[]>;
    /** Fire-and-forget refresh trigger for UI stores. */
    subscribe(listener: () => void): () => void;
    /** Look up the LiveSource handling a channel id by plugin prefix. */
    private route;
    private readStored;
    private emit;
}
//# sourceMappingURL=eagle.d.ts.map