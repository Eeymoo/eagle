import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts, SourcePlugin, PluginConnection } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
import { CoreError } from '@eagle/core';

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

export type HDHomeRunChannel = Channel & { source: 'hdhomerun' };

function normalizeBase(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

/** Fetch and validate /discover.json for a candidate device URL. */
export async function discoverDevice(port: Port, baseUrl: string): Promise<HDHomeRunDevice> {
  const base = normalizeBase(baseUrl);
  try {
    const device = await port.getJson<HDHomeRunDevice>(`${base}/discover.json`, { timeoutMs: 5_000 });
    if (!device?.BaseURL) throw new CoreError('PARSE', 'HDHomeRun: /discover.json missing BaseURL');
    return { ...device, BaseURL: normalizeBase(device.BaseURL || base) };
  } catch (e) {
    if (e instanceof CoreError && e.code === 'PARSE') throw e;
    throw new CoreError('NOT_FOUND', `HDHomeRun: no device at ${base}`, e);
  }
}

export class HDHomeRunSource extends LiveSourceBase {
  readonly kind = 'hdhomerun' as const;
  readonly sourceId: string;

  private cache?: { channels: HDHomeRunChannel[]; urlByNumber: Map<string, string> };

  constructor(
    private readonly port: Port,
    private readonly device: HDHomeRunDevice,
    sourceId = 'hdhomerun',
  ) {
    super();
    this.sourceId = sourceId;
  }

  private base(): string {
    return normalizeBase(this.device.BaseURL ?? '');
  }

  private lineupUrl(): string {
    return this.device.LineupURL || `${this.base()}/lineup.json`;
  }

  async listChannels(opts?: ListChannelsOpts): Promise<ChannelPage> {
    if (!opts?.force && this.cache) return { channels: this.cache.channels, nextCursor: undefined };
    let lineup: HDHomeRunLineupChannel[];
    try {
      lineup = await this.port.getJson<HDHomeRunLineupChannel[]>(this.lineupUrl(), { timeoutMs: 10_000 });
    } catch (e) {
      throw e instanceof CoreError
        ? e
        : new CoreError('NETWORK', `HDHomeRun: failed to fetch lineup at ${this.lineupUrl()}`, e);
    }
    const channels: HDHomeRunChannel[] = [];
    const urlByNumber = new Map<string, string>();
    for (const c of lineup) {
      if (!c.GuideNumber || !c.URL) continue;
      urlByNumber.set(c.GuideNumber, c.URL);
      channels.push({
        id: `hdhr:${c.GuideNumber}`,
        source: 'hdhomerun',
        name: c.GuideName || c.GuideNumber,
        number: c.GuideNumber,
        group: c.HD ? 'HD' : undefined,
      });
    }
    this.cache = { channels, urlByNumber };
    return { channels, nextCursor: undefined };
  }

  async resolveStream(channelId: string): Promise<StreamUrl> {
    if (!this.cache) await this.listChannels();
    const bare = channelId.replace(/^hdhr:/, '');
    const url = this.cache?.urlByNumber.get(bare);
    if (!url) throw new CoreError('NOT_FOUND', `HDHomeRun: channel ${channelId} not in lineup`);
    return { url, kind: 'hdhomerun', containerHint: 'ts' };
  }
}

/** Connection input for the HDHomeRun plugin. */
export interface HDHomeRunInput {
  deviceUrl: string;
  label?: string;
}

/** Declarative add-source form: heads render this generically. */
export const HDHOME_RUN_FORM_FIELDS = [
  { key: 'deviceUrl', label: 'HDHomeRun 设备地址', placeholder: 'http://192.168.1.50' },
] as const;

/**
 * HDHomeRun source plugin. Connect = discover.json probe; create =
 * HDHomeRunSource bound to the persisted device descriptor.
 */
export const hdHomeRunPlugin: SourcePlugin = {
  kind: 'hdhome-run',
  displayName: 'HDHomeRun',
  channelIdPrefix: 'hdhr',
  formFields: HDHOME_RUN_FORM_FIELDS,

  async connect(port, input) {
    const { deviceUrl, label } = input as unknown as HDHomeRunInput;
    if (!deviceUrl) throw new CoreError('PARSE', 'HDHomeRun: deviceUrl is required');
    const device = await discoverDevice(port, deviceUrl);
    const id = `hdhome-run:${device.DeviceID ?? port.hash(deviceUrl)}`;
    return {
      id,
      label: label ?? device.FriendlyName ?? normalizeBase(deviceUrl),
      state: { deviceUrl, device },
    };
  },

  create(port, connection) {
    const { device } = connection.state as { device: HDHomeRunDevice };
    return new HDHomeRunSource(port, device, connection.id);
  },
};
