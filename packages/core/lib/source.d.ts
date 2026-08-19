import type { Channel, ChannelPage, CoreError, SourceKind, StreamUrl } from './types.js';
import type { Port } from './types.js';
/** Options accepted by LiveSource.listChannels. */
export interface ListChannelsOpts {
    /** Opaque cursor from the previous page (future: large channel lists). */
    cursor?: string;
    /** Bypass source-level caches. */
    force?: boolean;
}
/**
 * Contract every live-TV source must fulfil. Core-generic services (channel
 * merge, search, playback resolution) are written against this interface only.
 */
export interface LiveSource {
    readonly kind: SourceKind;
    /** Id of the configured source instance this object is bound to. */
    readonly sourceId: string;
    /** Fetch one page of channels. */
    listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
    /**
     * Resolve a channel to a playable URL. May hit the network (Jellyfin
     * playback-info, HDHomeRun tune) or be pure (M3U urls are inline).
     */
    resolveStream(channelId: string): Promise<StreamUrl>;
    /** Optional search hint; default implementation filters by name. */
    searchChannels?(query: string): Promise<Channel[]>;
}
/** Convenience base with default name-filtering search. */
export declare abstract class LiveSourceBase implements LiveSource {
    abstract readonly kind: SourceKind;
    abstract readonly sourceId: string;
    abstract listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
    abstract resolveStream(channelId: string): Promise<StreamUrl>;
    searchChannels(query: string): Promise<Channel[]>;
}
/** Event emitted by EagleCore whenever channel data changes. */
export interface ChannelsChangedEvent {
    type: 'channels-changed';
    /** Source ids whose data changed; empty array = all sources. */
    sourceIds: string[];
}
export type EagleEvent = ChannelsChangedEvent;
/** Factory signature for constructing a LiveSource from a Port. */
export type LiveSourceFactory = (port: Port) => LiveSource;
export interface EagleCoreOptions {
    port: Port;
    settings: SettingsLike;
    /** Factories of sources to expose initially. */
    sources?: LiveSourceFactory[];
}
/** SettingsStore without the `remove` requirement (MVP simplification). */
export interface SettingsLike {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
}
export type { Channel, ChannelPage, CoreError, SourceKind, StreamUrl };
//# sourceMappingURL=source.d.ts.map