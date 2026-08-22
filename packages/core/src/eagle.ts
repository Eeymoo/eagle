import type { LiveSource } from './source.js';
import type { SourcePlugin, PluginConfig, PluginConnection } from './plugin.js';
import type {
  Channel,
  Port,
  SettingsStore,
  SourceKind,
  SourceRef,
  StreamUrl,
} from './types.js';
import { CoreError } from './types.js';

/** Persisted descriptor for one configured source (re-created on launch). */
export interface StoredSource {
  /** Plugin kind, e.g. 'jellyfin'. */
  kind: string;
  connection: PluginConnection;
}

const SOURCES_KEY = 'eagle.sources';

/**
 * Plugin-registry core. Ships with zero concrete sources; hosts register
 * source plugins at bootstrap and everything else (persistence, merging,
 * routing, notifications) is generic.
 */
export class EagleCore {
  private plugins = new Map<string, SourcePlugin>();
  private sources = new Map<string, { plugin: SourcePlugin; source: LiveSource }>();
  private channelCache = new Map<string, Channel[]>();
  private listeners = new Set<() => void>();

  constructor(
    private readonly port: Port,
    private readonly settings: SettingsStore,
  ) {}

  /** Register a source plugin (idempotent by kind). */
  use(plugin: SourcePlugin): this {
    this.plugins.set(plugin.kind, plugin);
    return this;
  }

  /** All registered plugins (settings screens iterate this for "add source"). */
  listPlugins(): SourcePlugin[] {
    return [...this.plugins.values()];
  }

  /** Read-only settings access for heads (feature flags, persisted prefs). */
  get settingsStore(): SettingsStore {
    return this.settings;
  }

  /** Restore previously configured sources from settings. */
  async hydrate(): Promise<void> {
    const stored = await this.settings.get<StoredSource[]>(SOURCES_KEY);
    if (!stored) return;
    for (const s of stored) {
      const plugin = this.plugins.get(s.kind);
      if (!plugin) continue; // plugin not registered (uninstalled?) — skip
      try {
        const source = plugin.create(this.port, s.connection);
        this.sources.set(s.connection.id, { plugin, source });
      } catch {
        // Skip broken persisted entries rather than failing boot.
      }
    }
    this.emit();
  }

  listSources(): SourceRef[] {
    return [...this.sources.values()].map(({ plugin, source }) => ({
      id: source.sourceId,
      kind: plugin.kind as SourceKind,
      label: source.sourceId,
    }));
  }

  /** Live source instances (heads probe optional capabilities, e.g. libraries). */
  getSources(): LiveSource[] {
    return [...this.sources.values()].map(({ source }) => source);
  }

  /** Add a source via its plugin: connect → persist → mount. */
  async addSource(kind: string, input: PluginConfig): Promise<SourceRef> {
    const plugin = this.plugins.get(kind);
    if (!plugin) throw new CoreError('UNSUPPORTED', `No source plugin registered for "${kind}"`);
    const connection = await plugin.connect(this.port, input);
    const stored = await this.readStored();
    const next = [...stored.filter((s) => s.connection.id !== connection.id), { kind, connection }];
    await this.settings.set(SOURCES_KEY, next);
    const source = plugin.create(this.port, connection);
    this.sources.set(connection.id, { plugin, source });
    this.emit();
    return { id: connection.id, kind: plugin.kind as SourceKind, label: connection.label };
  }

  async removeSource(id: string): Promise<void> {
    const stored = await this.readStored();
    await this.settings.set(
      SOURCES_KEY,
      stored.filter((s) => s.connection.id !== id),
    );
    this.sources.delete(id);
    this.channelCache.delete(id);
    this.emit();
  }

  /** Merged channel list across all attached sources. */
  async listChannels(): Promise<Channel[]> {
    const out: Channel[] = [];
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
      } catch {
        // A failing source must not break the whole channel list (MVP: skip).
      }
    }
    return out;
  }

  /** Invalidate cached channel lists (pull-to-refresh). */
  invalidateChannels(): void {
    this.channelCache.clear();
    this.emit();
  }

  async resolveStream(channelId: string): Promise<StreamUrl> {
    const entry = this.route(channelId);
    return entry.source.resolveStream(channelId);
  }

  async searchChannels(query: string): Promise<Channel[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await this.listChannels();
    return all.filter((c) => c.name.toLowerCase().includes(q));
  }

  /** Fire-and-forget refresh trigger for UI stores. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Look up the LiveSource handling a channel id by plugin prefix. */
  private route(channelId: string): { plugin: SourcePlugin; source: LiveSource } {
    const hit = [...this.sources.values()].find(({ plugin }) =>
      channelId.startsWith(`${plugin.channelIdPrefix}:`),
    );
    if (!hit) throw new CoreError('NOT_FOUND', `No source handles channel ${channelId}`);
    return hit;
  }

  private async readStored(): Promise<StoredSource[]> {
    return (await this.settings.get<StoredSource[]>(SOURCES_KEY)) ?? [];
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}
