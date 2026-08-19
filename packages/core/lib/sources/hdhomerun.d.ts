import { LiveSourceBase } from '../source.js';
import type { ListChannelsOpts } from '../source.js';
import type { Channel, ChannelPage, Port, StreamUrl } from '../types.js';
/** Lineup from `/lineup.json` (discovered via `/discover.json`). */
export interface HDHomeRunLineup {
    device: HDHomeRunDevice;
    channels: HDHomeRunLineupChannel[];
}
export interface HDHomeRunDevice {
    FriendlyName?: string;
    Manufacturer?: string;
    ModelNumber?: string;
    FirmwareName?: string;
    BaseURL?: string;
    LineupURL?: string;
    TunerCount?: number;
    DeviceID?: string;
}
export interface HDHomeRunLineupChannel {
    GuideName: string;
    GuideNumber: string;
    URL: string;
    HD?: number;
    Favorite?: number;
}
export type HDHomeRunChannel = Channel & {
    source: 'hdhomerun';
};
/** Fetch and validate /discover.json for a candidate device URL. */
export declare function discoverDevice(port: Port, baseUrl: string): Promise<HDHomeRunDevice>;
export declare class HDHomeRunSource extends LiveSourceBase {
    private readonly port;
    private readonly device;
    readonly kind: "hdhomerun";
    readonly sourceId: string;
    private cache?;
    constructor(port: Port, device: HDHomeRunDevice, sourceId?: string);
    private base;
    private lineupUrl;
    listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
    resolveStream(channelId: string): Promise<StreamUrl>;
}
//# sourceMappingURL=hdhomerun.d.ts.map