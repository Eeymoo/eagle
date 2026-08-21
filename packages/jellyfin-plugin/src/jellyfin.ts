import { LiveSourceBase } from '@eagle/core';
import type { ListChannelsOpts } from '@eagle/core';
import type { Channel, ChannelPage, Port, StreamUrl } from '@eagle/core';
import { CoreError } from '@eagle/core';

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

export type JellyfinChannel = Channel & { source: 'jellyfin' };

interface JellyfinChannelDto {
  Id: string;
  Name?: string;
  Number?: string;
  ImageTags?: { Primary?: string };
  CollectionType?: string;
}

interface JellyfinAuthResult {
  User?: { Id: string; Name?: string };
  AccessToken?: string;
  ServerId?: string;
}

/** Join base URL and path. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Append query params to a URL (which must not already carry a query). */
export function withParams(url: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${url}?${qs}` : url;
}

const CLIENT_HEADER =
  'MediaBrowser Client="Eagle", Device="Eagle RN", DeviceId="eagle-mvp-1", Version="0.1.0"';

/**
 * Auth header carriers across Jellyfin versions: legacy servers read
 * X-Emby-Authorization, Jellyfin 12 requires the standard Authorization
 * header. Send both — servers ignore the one they don't know.
 */
const AUTH_HEADERS: Record<string, string> = {
  Authorization: CLIENT_HEADER,
  'X-Emby-Authorization': CLIENT_HEADER,
};

export class JellyfinSource extends LiveSourceBase {
  readonly kind = 'jellyfin' as const;
  readonly sourceId: string;

  constructor(
    private readonly port: Port,
    private readonly session: JellyfinSession,
    sourceId = 'jellyfin',
  ) {
    super();
    this.sourceId = sourceId;
  }

  private authHeaders(): Record<string, string> {
    return { Accept: 'application/json', 'X-Emby-Token': this.session.accessToken };
  }

  async listChannels(_opts?: ListChannelsOpts): Promise<ChannelPage> {
    const url = withParams(joinUrl(this.session.serverUrl, 'LiveTv/Channels'), {
      EnableImages: 'true',
      ImageTypeLimit: '1',
    });
    const dto = await this.port.getJson<{ Items?: JellyfinChannelDto[] }>(url, {
      headers: this.authHeaders(),
    });
    const channels = (dto.Items ?? []).map((item) => this.toChannel(item));
    return { channels, nextCursor: undefined };
  }

  async resolveStream(channelId: string): Promise<StreamUrl> {
    const bare = channelId.replace(/^jf:/, '');
    if (!bare) throw new CoreError('NOT_FOUND', `Jellyfin: bad channel id "${channelId}"`);
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

  private toChannel(item: JellyfinChannelDto): JellyfinChannel {
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
export async function authenticate(port: Port, config: JellyfinConfig): Promise<JellyfinSession> {
  if (typeof port.postJson !== 'function') {
    throw new CoreError('UNSUPPORTED', 'Jellyfin auth requires a Port with postJson');
  }
  const url = joinUrl(config.serverUrl, 'Users/AuthenticateByName');
  try {
    const result = await port.postJson<JellyfinAuthResult>(
      url,
      { Username: config.username, Pw: config.password },
      { headers: AUTH_HEADERS },
    );
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
  } catch (e) {
    if (e instanceof CoreError) throw e;
    throw new CoreError('AUTH_FAILED', 'Jellyfin: authenticate failed', e);
  }
}

/** Quick unauthenticated reachability/name check (optional in MVP UI). */
export async function fetchServerInfo(
  port: Port,
  serverUrl: string,
): Promise<{ id?: string; name?: string }> {
  try {
    const info = await port.getJson<{ Id?: string; ServerName?: string }>(
      joinUrl(serverUrl, 'System/Info/Public'),
    );
    return { id: info.Id, name: info.ServerName };
  } catch (e) {
    if (e instanceof CoreError) throw e;
    throw new CoreError('NETWORK', 'Jellyfin: server info failed', e);
  }
}
