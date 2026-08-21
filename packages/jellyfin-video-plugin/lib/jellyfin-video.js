/**
 * Jellyfin video-mode source — the media library (movies & episodes) as
 * on-demand "channels".
 *
 * Reuses the live plugin's auth (authenticate + JellyfinSession) and the
 * Jellyfin-12 playback path (videos/{id}/master.m3u8 + Authorization
 * header). Items are listed via /Users/{userId}/Items with internal paging
 * (core takes a single page, so this source loops StartIndex itself).
 */
import { LiveSourceBase } from '@eagle/core';
import { CoreError } from '@eagle/core';
import { authenticate, joinUrl, withParams } from '@eagle/jellyfin-plugin';
/** Containers a browser <video> can play directly (static streaming), in
 *  preference order — mp4 is universally the safest choice. */
const CONTAINER_PREFERENCE = ['mp4', 'm4v', 'webm', 'mov'];
/** Movies + episodes; cap so pathological libraries don't stall the list. */
const INCLUDE_TYPES = 'Movie,Episode';
const PAGE_SIZE = 500;
const MAX_ITEMS = 4000;
export class JellyfinVideoSource extends LiveSourceBase {
    port;
    session;
    kind = 'jellyfin-video';
    sourceId;
    cache;
    /** itemId → item, for stream resolution metadata. */
    byId = new Map();
    constructor(port, session, sourceId = 'jellyfin-video') {
        super();
        this.port = port;
        this.session = session;
        this.sourceId = sourceId;
    }
    authHeaders() {
        // Jellyfin 12: standard Authorization header only.
        return {
            Accept: 'application/json',
            Authorization: `MediaBrowser Token="${this.session.accessToken}"`,
        };
    }
    /**
     * Authenticated GET with silent re-login + single retry when the stored
     * token was invalidated (each new Jellyfin 12 login kills older tokens).
     */
    async authedJson(url, init) {
        const attempt = () => this.port.getJson(url, { ...init, headers: { ...init?.headers, ...this.authHeaders() } });
        try {
            return await attempt();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const causeMsg = e instanceof CoreError && e.cause instanceof Error ? e.cause.message : '';
            const unauthorized = /401|unauthorized/i.test(`${msg} ${causeMsg}`);
            if (!unauthorized || !this.session.username || this.session.password === undefined)
                throw e;
            this.session = await authenticate(this.port, {
                serverUrl: this.session.serverUrl,
                username: this.session.username,
                password: this.session.password,
            });
            return await attempt();
        }
    }
    async listChannels(opts) {
        if (!opts?.force && this.cache)
            return { channels: this.cache, nextCursor: undefined };
        const channels = [];
        const byId = new Map();
        for (let start = 0; start < MAX_ITEMS; start += PAGE_SIZE) {
            const url = withParams(joinUrl(this.session.serverUrl, `Users/${this.session.userId}/Items`), {
                IncludeItemTypes: INCLUDE_TYPES,
                Recursive: 'true',
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                StartIndex: String(start),
                Limit: String(PAGE_SIZE),
                EnableImages: 'true',
                ImageTypeLimit: '1',
            });
            let dto;
            try {
                dto = await this.authedJson(url, { timeoutMs: 15_000 });
            }
            catch (e) {
                if (channels.length > 0)
                    break; // partial list beats nothing
                throw e instanceof CoreError
                    ? e
                    : new CoreError('NETWORK', 'Jellyfin 媒体库: 拉取条目失败', e);
            }
            const items = dto.Items ?? [];
            for (const item of items) {
                if (!item.Id)
                    continue;
                byId.set(item.Id, item);
                channels.push(this.toChannel(item));
            }
            if (items.length < PAGE_SIZE || channels.length >= (dto.TotalRecordCount ?? 0))
                break;
        }
        this.cache = channels;
        this.byId = byId;
        return { channels, nextCursor: undefined };
    }
    toChannel(item) {
        const tag = item.ImageTags?.Primary;
        const isEpisode = item.Type === 'Episode';
        // "S01E02 片名" makes episodes sortable/searchable inside a series group.
        const name = isEpisode && item.ParentIndexNumber != null && item.IndexNumber != null
            ? `S${String(item.ParentIndexNumber).padStart(2, '0')}E${String(item.IndexNumber).padStart(2, '0')} ${item.Name ?? item.Id}`
            : `${item.Name ?? item.Id}${item.ProductionYear ? ` (${item.ProductionYear})` : ''}`;
        return {
            id: `jfv:${item.Id}`,
            source: 'jellyfin-video',
            name,
            logoUrl: tag
                ? withParams(joinUrl(this.session.serverUrl, `Items/${item.Id}/Images/Primary`), {
                    tag,
                    quality: '90',
                })
                : undefined,
            group: item.SeriesName ?? (isEpisode ? undefined : '电影'),
        };
    }
    async resolveStream(channelId) {
        const bare = channelId.replace(/^jfv:/, '');
        if (!bare)
            throw new CoreError('NOT_FOUND', `Jellyfin 媒体库: bad id "${channelId}"`);
        // Direct file streaming (static): zero server transcoding, HTTP Range
        // support, native <video> playback with seek. api_key query auth WORKS
        // on this endpoint (unlike master.m3u8), so no header injection needed.
        // Falls back to transcoded HLS only for containers the web can't play.
        // "mov,mp4,…" → pick the best web-playable container (mp4 > m4v > webm >
        // mov; list order is arbitrary), else "" = transcode fallback.
        const raw = (this.byId.get(bare)?.Container ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        const container = CONTAINER_PREFERENCE.find((c) => raw.includes(c)) ?? '';
        if (container) {
            return {
                url: withParams(joinUrl(this.session.serverUrl, `videos/${bare}/stream.${container}`), {
                    static: 'true',
                    api_key: this.session.accessToken,
                }),
                kind: 'jellyfin-http',
                containerHint: container,
            };
        }
        // Transcode path (mkv/avi/…): PlaybackInfo → master.m3u8 + auth header.
        let mediaSourceId;
        try {
            const postJson = this.port.postJson?.bind(this.port);
            const pbi = postJson
                ? await postJson(joinUrl(this.session.serverUrl, `Items/${bare}/PlaybackInfo`), { UserId: this.session.userId }, { headers: this.authHeaders(), timeoutMs: 10_000 })
                : undefined;
            mediaSourceId = pbi?.MediaSources?.[0]?.Id ?? undefined;
        }
        catch {
            // single-source items play fine without MediaSourceId
        }
        const streamUrl = withParams(joinUrl(this.session.serverUrl, `videos/${bare}/master.m3u8`), {
            ...(mediaSourceId ? { MediaSourceId: mediaSourceId } : {}),
        });
        return {
            url: streamUrl,
            kind: 'jellyfin-hls',
            containerHint: 'm3u8',
            headers: {
                Authorization: `MediaBrowser Token="${this.session.accessToken}"`,
            },
        };
    }
}
/** Declarative add-source form: heads render this generically. */
export const JELLYFIN_VIDEO_FORM_FIELDS = [
    { key: 'serverUrl', label: '服务器地址', placeholder: 'http://192.168.1.10:8096' },
    { key: 'username', label: '用户名', placeholder: 'admin' },
    { key: 'password', label: '密码', secure: true },
];
/**
 * Jellyfin video-mode plugin. Same login as the live plugin; listing maps
 * library items to on-demand channels.
 */
export const jellyfinVideoPlugin = {
    kind: 'jellyfin-video',
    displayName: 'Jellyfin 媒体库',
    channelIdPrefix: 'jfv',
    formFields: JELLYFIN_VIDEO_FORM_FIELDS,
    async connect(port, input) {
        const { label, ...config } = input;
        if (!config.serverUrl || !config.username) {
            throw new CoreError('PARSE', 'Jellyfin 媒体库: serverUrl and username are required');
        }
        const session = await authenticate(port, config);
        // Persist credentials for silent re-login (see authedJson).
        const state = { session: { ...session, password: config.password } };
        const id = `jellyfin-video:${port.hash(config.serverUrl)}`;
        return {
            id,
            label: label ?? `${config.serverUrl} 媒体库`,
            state: state,
        };
    },
    create(port, connection) {
        const { session } = connection.state;
        return new JellyfinVideoSource(port, session, connection.id);
    },
};
//# sourceMappingURL=jellyfin-video.js.map