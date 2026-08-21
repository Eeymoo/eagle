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
import type { ListChannelsOpts, SourcePlugin } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
import type { JellyfinSession } from '@eagle/jellyfin-plugin';
export type JellyfinVideoChannel = Channel & {
    source: 'jellyfin-video';
};
export declare class JellyfinVideoSource extends LiveSourceBase {
    private readonly port;
    private readonly session;
    readonly kind: "jellyfin-video";
    readonly sourceId: string;
    private cache?;
    /** itemId → item, for stream resolution metadata. */
    private byId;
    constructor(port: Port, session: JellyfinSession, sourceId?: string);
    private authHeaders;
    listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
    private toChannel;
    resolveStream(channelId: string): Promise<StreamUrl>;
}
/** Connection input for the Jellyfin video-mode plugin. */
export interface JellyfinVideoInput {
    serverUrl: string;
    username: string;
    password: string;
    label?: string;
}
/** Declarative add-source form: heads render this generically. */
export declare const JELLYFIN_VIDEO_FORM_FIELDS: readonly [{
    readonly key: "serverUrl";
    readonly label: "服务器地址";
    readonly placeholder: "http://192.168.1.10:8096";
}, {
    readonly key: "username";
    readonly label: "用户名";
    readonly placeholder: "admin";
}, {
    readonly key: "password";
    readonly label: "密码";
    readonly secure: true;
}];
/**
 * Jellyfin video-mode plugin. Same login as the live plugin; listing maps
 * library items to on-demand channels.
 */
export declare const jellyfinVideoPlugin: SourcePlugin;
//# sourceMappingURL=jellyfin-video.d.ts.map