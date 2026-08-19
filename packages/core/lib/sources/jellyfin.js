import { LiveSourceBase } from '../source.js';
import { CoreError } from '../types.js';
/** Join base URL and path. */
export function joinUrl(base, path) {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
/** Append query params to a URL (which must not already carry a query). */
export function withParams(url, params) {
    const qs = new URLSearchParams(params).toString();
    return qs ? `${url}?${qs}` : url;
}
const CLIENT_HEADER = 'MediaBrowser Client="Eagle", Device="Eagle RN", DeviceId="eagle-mvp-1", Version="0.1.0"';
export class JellyfinSource extends LiveSourceBase {
    port;
    session;
    kind = 'jellyfin';
    sourceId;
    constructor(port, session, sourceId = 'jellyfin') {
        super();
        this.port = port;
        this.session = session;
        this.sourceId = sourceId;
    }
    authHeaders() {
        return { Accept: 'application/json', 'X-Emby-Token': this.session.accessToken };
    }
    async listChannels(_opts) {
        const url = withParams(joinUrl(this.session.serverUrl, 'LiveTv/Channels'), {
            EnableImages: 'true',
            ImageTypeLimit: '1',
        });
        const dto = await this.port.getJson(url, {
            headers: this.authHeaders(),
        });
        const channels = (dto.Items ?? []).map((item) => this.toChannel(item));
        return { channels, nextCursor: undefined };
    }
    async resolveStream(channelId) {
        const bare = channelId.replace(/^jf:/, '');
        if (!bare)
            throw new CoreError('NOT_FOUND', `Jellyfin: bad channel id "${channelId}"`);
        const url = joinUrl(this.session.serverUrl, `LiveTv/Channels/${bare}/Play`);
        return {
            // Direct stream: MVP players handle the raw ts container better than
            // full PlaybackInfo negotiation; api_key auth keeps players header-free.
            url: withParams(url, { api_key: this.session.accessToken }),
            kind: 'jellyfin-http',
            containerHint: 'ts',
            headers: { 'X-Emby-Token': this.session.accessToken },
        };
    }
    toChannel(item) {
        const tag = item.ImageTags?.Primary;
        return {
            id: `jf:${item.Id}`,
            source: 'jellyfin',
            name: item.Name ?? item.Id,
            number: item.Number,
            logoUrl: tag
                ? withParams(joinUrl(this.session.serverUrl, `Items/${item.Id}/Images/Primary`), {
                    tag,
                    quality: '90',
                })
                : undefined,
            group: item.CollectionType,
        };
    }
}
/**
 * AuthenticateByName (POST). Uses `port.postJson`, which the active Port
 * implementation must provide; callers get UNSUPPORTED otherwise.
 */
export async function authenticate(port, config) {
    if (typeof port.postJson !== 'function') {
        throw new CoreError('UNSUPPORTED', 'Jellyfin auth requires a Port with postJson');
    }
    const url = joinUrl(config.serverUrl, 'Users/AuthenticateByName');
    try {
        const result = await port.postJson(url, { Username: config.username, Pw: config.password }, { headers: { 'X-Emby-Authorization': CLIENT_HEADER } });
        if (!result?.AccessToken || !result?.User?.Id) {
            throw new CoreError('AUTH_FAILED', 'Jellyfin: malformed auth response');
        }
        return {
            serverUrl: config.serverUrl,
            serverId: result.ServerId,
            userId: result.User.Id,
            accessToken: result.AccessToken,
            username: result.User.Name ?? config.username,
        };
    }
    catch (e) {
        if (e instanceof CoreError)
            throw e;
        throw new CoreError('AUTH_FAILED', 'Jellyfin: authenticate failed', e);
    }
}
/** Quick unauthenticated reachability/name check (optional in MVP UI). */
export async function fetchServerInfo(port, serverUrl) {
    try {
        const info = await port.getJson(joinUrl(serverUrl, 'System/Info/Public'));
        return { id: info.Id, name: info.ServerName };
    }
    catch (e) {
        if (e instanceof CoreError)
            throw e;
        throw new CoreError('NETWORK', 'Jellyfin: server info failed', e);
    }
}
//# sourceMappingURL=jellyfin.js.map