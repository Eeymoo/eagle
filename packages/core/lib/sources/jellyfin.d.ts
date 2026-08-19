import { LiveSourceBase } from '../source.js';
import type { ListChannelsOpts } from '../source.js';
import type { Channel, ChannelPage, Port, StreamUrl } from '../types.js';
/** Persisted per-server credential bundle (stored via SettingsStore). */
export interface JellyfinSession {
    serverUrl: string;
    serverId?: string;
    serverName?: string;
    userId: string;
    accessToken: string;
    username?: string;
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
    private readonly session;
    readonly kind: "jellyfin";
    readonly sourceId: string;
    constructor(port: Port, session: JellyfinSession, sourceId?: string);
    private authHeaders;
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