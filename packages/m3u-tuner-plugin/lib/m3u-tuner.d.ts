import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts, SourcePlugin, PluginConnection } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
/** One parsed #EXTINF entry. */
export interface M3UEntry {
    name: string;
    url: string;
    group?: string;
    logoUrl?: string;
    tvgId?: string;
}
export type M3UChannel = Channel & {
    source: 'm3u';
};
/** Parse an M3U/M3U8 playlist body into entries (extended format primarily). */
export declare function parseM3U(text: string): M3UEntry[];
export declare class M3USource extends LiveSourceBase {
    private readonly port;
    private readonly playlistUrl;
    readonly kind: "m3u";
    readonly sourceId: string;
    private cache?;
    constructor(port: Port, playlistUrl: string, sourceId?: string);
    listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
    resolveStream(channelId: string): Promise<StreamUrl>;
}
/** Connection input for the M3U Tuner plugin. */
export interface M3UTunerInput {
    playlistUrl: string;
    label?: string;
}
/** Persisted state shape for M3U Tuner connections. */
export interface M3UTunerState extends PluginConnection {
    state: {
        playlistUrl: string;
    };
}
/**
 * M3U Tuner source plugin. Connect = validate the playlist is reachable and
 * parses; create = instantiate M3USource from the persisted playlist URL.
 */
export declare const m3uTunerPlugin: SourcePlugin;
//# sourceMappingURL=m3u-tuner.d.ts.map