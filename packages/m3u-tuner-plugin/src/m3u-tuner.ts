import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts, SourcePlugin, PluginConnection } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
import { CoreError } from '@eagle/core';

/** One parsed #EXTINF entry. */
export interface M3UEntry {
  name: string;
  url: string;
  group?: string;
  logoUrl?: string;
  tvgId?: string;
}

export type M3UChannel = Channel & { source: 'm3u' };

/** Parse an M3U/M3U8 playlist body into entries (extended format primarily). */
export function parseM3U(text: string): M3UEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: M3UEntry[] = [];
  let pending: Partial<M3UEntry> | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      // #EXTINF:-1 tvg-id="x" tvg-logo="y" group-title="z",Display Name
      const meta = line.slice(line.indexOf(':') + 1);
      const commaIdx = meta.lastIndexOf(',');
      const attr = (part: string, key: string): string | undefined => {
        const m = part.match(new RegExp(`${key}="([^"]*)"`));
        return m?.[1] || undefined;
      };
      let attrsPart: string;
      let name: string;
      if (commaIdx >= 0) {
        attrsPart = meta.slice(0, commaIdx);
        name = meta.slice(commaIdx + 1).trim();
      } else {
        // Tolerate comma-less lines: strip duration and key="value" attrs;
        // whatever remains is the display name.
        attrsPart = meta;
        name = meta
          .replace(/^[-\d.]+\s*/, '')
          .replace(/[A-Za-z0-9-]+="[^"]*"\s*/g, '')
          .trim();
      }
      pending = {
        name,
        tvgId: attr(attrsPart, 'tvg-id'),
        logoUrl: attr(attrsPart, 'tvg-logo'),
        group: attr(attrsPart, 'group-title'),
      };
    } else if (!line.startsWith('#')) {
      // A non-comment line is a URL and terminates the current entry.
      if (pending) {
        entries.push({ ...pending, url: line } as M3UEntry);
        pending = undefined;
      } else if (/^https?:\/\//i.test(line)) {
        // Bare-URL playlists (no EXTINF headers) are tolerated.
        entries.push({ name: line, url: line });
      }
    }
  }
  return entries;
}

const PLAYLIST_CACHE_MS = 5 * 60_000;

export class M3USource extends LiveSourceBase {
  readonly kind = 'm3u' as const;
  readonly sourceId: string;

  private cache?: { at: number; channels: M3UChannel[]; urlById: Map<string, string> };

  constructor(
    private readonly port: Port,
    private readonly playlistUrl: string,
    sourceId = 'm3u',
  ) {
    super();
    this.sourceId = sourceId;
  }

  async listChannels(opts?: ListChannelsOpts): Promise<ChannelPage> {
    const now = this.port.now();
    if (!opts?.force && this.cache && now - this.cache.at < PLAYLIST_CACHE_MS) {
      return { channels: this.cache.channels, nextCursor: undefined };
    }
    let text: string;
    try {
      // 60s: iptv-org/github.io playlists can take 20s+ to arrive on slow
      // networks (measured 21.8s on a MIUI device); 20s timed out there.
      text = await this.port.getText(this.playlistUrl, { timeoutMs: 60_000 });
    } catch (e) {
      throw e instanceof CoreError
        ? e
        : new CoreError('NETWORK', `M3U: failed to fetch playlist ${this.playlistUrl}`, e);
    }
    if (!text.startsWith('#EXTM3U') && !/#EXTM3U\r?\n/.test(text.slice(0, 128))) {
      throw new CoreError('PARSE', 'M3U: missing #EXTM3U header');
    }
    const entries = parseM3U(text);
    const channels: M3UChannel[] = [];
    const urlById = new Map<string, string>();
    for (const entry of entries) {
      const id = `m3u:${this.port.hash(entry.url)}`;
      if (urlById.has(id)) continue; // de-dup repeated urls
      urlById.set(id, entry.url);
      channels.push({
        id,
        source: 'm3u',
        name: entry.name,
        logoUrl: entry.logoUrl,
        group: entry.group,
      });
    }
    this.cache = { at: now, channels, urlById };
    return { channels, nextCursor: undefined };
  }

  async resolveStream(channelId: string): Promise<StreamUrl> {
    // Prefer the cached map; only re-fetch on cache miss (fresh playlists).
    if (!this.cache) await this.listChannels();
    const url = this.cache?.urlById.get(channelId);
    if (!url) throw new CoreError('NOT_FOUND', `M3U: channel ${channelId} not in playlist`);
    return { url, kind: 'm3u', containerHint: 'ts' };
  }
}

/** Connection input for the M3U Tuner plugin. */
export interface M3UTunerInput {
  playlistUrl: string;
  label?: string;
}

/** Declarative add-source form: heads render this generically. */
export const M3U_TUNER_FORM_FIELDS = [
  { key: 'playlistUrl', label: 'M3U 播放列表 URL', placeholder: 'http://example.com/playlist.m3u' },
] as const;

/** Persisted state shape for M3U Tuner connections. */
export interface M3UTunerState extends PluginConnection {
  state: { playlistUrl: string };
}

/**
 * M3U Tuner source plugin. Connect = validate the playlist is reachable and
 * parses; create = instantiate M3USource from the persisted playlist URL.
 */
export const m3uTunerPlugin: SourcePlugin = {
  kind: 'm3u-tuner',
  displayName: 'M3U Tuner',
  channelIdPrefix: 'm3u',
  formFields: M3U_TUNER_FORM_FIELDS,

  async connect(port, input) {
    const { playlistUrl, label } = input as unknown as M3UTunerInput;
    if (!playlistUrl || !/^https?:\/\//i.test(playlistUrl)) {
      throw new CoreError('PARSE', 'M3U Tuner: playlistUrl must be an http(s) URL');
    }
    // Validate by fetching once through a throwaway source.
    const probe = new M3USource(port, playlistUrl, 'probe');
    await probe.listChannels(); // throws NETWORK/PARSE on failure
    const id = `m3u-tuner:${port.hash(playlistUrl)}`;
    return { id, label: label ?? playlistUrl, state: { playlistUrl } };
  },

  create(port, connection) {
    const { playlistUrl } = connection.state as { playlistUrl: string };
    return new M3USource(port, playlistUrl, connection.id);
  },
};
