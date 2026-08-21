/**
 * Eagle core — shared, platform-agnostic primitives.
 *
 * Nothing in this file may import `react-native`, `@tauri-apps/*`, DOM or Node
 * APIs. Anything environment-specific is expressed as a capability interface
 * (see `Port`) that the active UI plugin injects at bootstrap.
 */
/** Fully-resolved URL of a playable stream. */
export interface StreamUrl {
    /** Absolute URL, ready to be handed to a player. */
    url: string;
    /** Where the URL came from; players may need special-casing. */
    kind: 'jellyfin-hls' | 'jellyfin-http' | 'm3u' | 'hdhomerun';
    /**
     * Preferred container/protocol hint derived from the source (e.g. `ts`,
     * `mp4`, `m3u8`). Purely advisory; players should still probe.
     */
    containerHint?: string;
    /** HTTP headers the player must send (Jellyfin token, HDHomeRun none). */
    headers?: Record<string, string>;
}
/** A playable live-TV channel, normalized across all source kinds. */
export interface Channel {
    /** Stable id, namespaced by source: `jf:<itemId>`, `m3u:<hash>`, `hdhr:<guide>`. */
    id: string;
    /** Caller-visible source type. */
    source: SourceKind;
    /** Display name. */
    name: string;
    /** Optional logo url. */
    logoUrl?: string;
    /** Optional channel number as presented by the source (e.g. "12.1"). */
    number?: string;
    /** Optional grouping (Jellyfin collection / M3U group-title). */
    group?: string;
    /**
     * True for on-demand items (media-library movies/episodes): players show
     * a seek bar + duration and drop LIVE semantics. Live sources omit it.
     */
    isVod?: boolean;
}
export type SourceKind = 'jellyfin' | 'jellyfin-video' | 'm3u' | 'hdhomerun';
/** Identifies one configured live-TV source instance. */
export interface SourceRef {
    id: string;
    kind: PlatformSourceKind;
    /** Human label shown in the UI. */
    label: string;
    /** ISO date; used for "last checked" display. */
    addedAt?: string;
}
export type PlatformSourceKind = SourceKind;
/** Minimal channel-list pagination (MVP: all channels in one page). */
export interface ChannelPage {
    channels: Channel[];
    /** Opaque cursor for the next page; absent on the last page. */
    nextCursor?: string;
}
/** Unified error type thrown by every core API. */
export declare class CoreError extends Error {
    readonly code: CoreErrorCode;
    readonly cause?: unknown;
    constructor(code: CoreErrorCode, message: string, cause?: unknown);
}
export type CoreErrorCode = 'AUTH_FAILED' | 'NETWORK' | 'PARSE' | 'NOT_FOUND' | 'UNSUPPORTED' | 'PLAYBACK_RESOLVE';
/** Progress/result snapshot of an asynchronous core operation. */
export type AsyncState<T> = {
    status: 'idle';
} | {
    status: 'loading';
    message?: string;
} | {
    status: 'ready';
    data: T;
} | {
    status: 'error';
    error: CoreError;
};
/** Platform capabilities the core needs but cannot implement itself. */
export interface Port {
    /** HTTP GET returning text (M3U playlists, HDHomeRun lineage.xml, Jellyfin JSON). */
    getText(url: string, init?: HttpInit): Promise<string>;
    /** HTTP GET returning parsed JSON. */
    getJson<T>(url: string, init?: HttpInit): Promise<T>;
    /**
     * Optional POST-as-JSON (needed by Jellyfin AuthenticateByName). Ports that
     * cannot POST simply omit it; callers must feature-check before use.
     */
    postJson?<T>(url: string, body: unknown, init?: HttpInit): Promise<T>;
    /** Current wall time in ms — lets tests freeze time. */
    now(): number;
    /** Stable string hash (FNV-1a or similar) for ids. */
    hash(input: string): string;
}
export interface HttpInit {
    headers?: Record<string, string>;
    /** Overall timeout in ms. */
    timeoutMs?: number;
}
/** Read-only view of persisted configuration (credentials, source list). */
export interface SettingsStore {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
}
/** M3U playlists can be large; `parseM3U` streams them in chunks. */
export interface M3UParserInput {
    /** Next chunk of playlist text; empty string signals EOF. */
    read(): Promise<string>;
}
export declare const CHANNEL_LIST_PAGE_SIZE = 200;
//# sourceMappingURL=types.d.ts.map