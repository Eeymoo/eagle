import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts, SourcePlugin } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
/** Device descriptor from /discover.json. */
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
/** Connection input for the HDHomeRun plugin. */
export interface HDHomeRunInput {
    deviceUrl: string;
    label?: string;
}
/**
 * HDHomeRun source plugin. Connect = discover.json probe; create =
 * HDHomeRunSource bound to the persisted device descriptor.
 */
export declare const hdHomeRunPlugin: SourcePlugin;
//# sourceMappingURL=hdhome-run.d.ts.map