import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
/** Persisted per-server credential bundle (stored via SettingsStore). */
export interface JellyfinSession {
    serverUrl: string;
    serverId?: string;
    serverName?: string;
    userId: string;
    accessToken: string;
    username?: string;
    /** Retained for silent re-login when the token is invalidated. */
    password?: string;
}
export interface JellyfinConfig {
    serverUrl: string;
    username: string;
    password: string;
}
export type JellyfinChannel = Channel & {
    source: 'jellyfin';
};
/** Join base URL and path. */
export declare function joinUrl(base: string, path: string): string;
/** Append query params to a URL (which must not already carry a query). */
export declare function withParams(url: string, params: Record<string, string>): string;
export declare class JellyfinSource extends LiveSourceBase {
    private readonly port;
    private session;
    readonly kind: "jellyfin";
    readonly sourceId: string;
    constructor(port: Port, session: JellyfinSession, sourceId?: string);
    private authHeaders;
    /**
     * Run an authenticated JSON call, silently re-loginning and retrying once
     * when the stored token was invalidated (each new login invalidates older
     * tokens on Jellyfin 12).
     */
    private authedJson;
    listChannels(_opts?: ListChannelsOpts): Promise<ChannelPage>;
    resolveStream(channelId: string): Promise<StreamUrl>;
    private toChannel;
}
/**
 * AuthenticateByName (POST). Uses `port.postJson`, which the active Port
 * implementation must provide; callers get UNSUPPORTED otherwise.
 */
export declare function authenticate(port: Port, config: JellyfinConfig): Promise<JellyfinSession>;
/** Quick unauthenticated reachability/name check (optional in MVP UI). */
export declare function fetchServerInfo(port: Port, serverUrl: string): Promise<{
    id?: string;
    name?: string;
}>;
//# sourceMappingURL=jellyfin.d.ts.map