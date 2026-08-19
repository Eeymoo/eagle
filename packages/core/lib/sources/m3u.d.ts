import { LiveSourceBase } from '../source.js';
import type { ListChannelsOpts } from '../source.js';
import type { Channel, ChannelPage, Port, StreamUrl } from '../types.js';
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
//# sourceMappingURL=m3u.d.ts.map