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
  /** Retained for silent re-login when the token is invalidated. */
  password?: string;
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
    private session: JellyfinSession,
    sourceId = 'jellyfin',
  ) {
    super();
    this.sourceId = sourceId;
  }

  private authHeaders(): Record<string, string> {
    // Jellyfin 12: standard Authorization header; legacy X-Emby-Token → 401.
    return {
      Accept: 'application/json',
      Authorization: `MediaBrowser Token="${this.session.accessToken}"`,
    };
  }

  /**
   * Run an authenticated JSON call, silently re-loginning and retrying once
   * when the stored token was invalidated (each new login invalidates older
   * tokens on Jellyfin 12).
   */
  private async authedJson<T>(url: string, init?: { headers?: Record<string, string>; timeoutMs?: number }): Promise<T> {
    const attempt = (): Promise<T> => this.port.getJson<T>(url, { ...init, headers: { ...init?.headers, ...this.authHeaders() } });
    try {
      return await attempt();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const causeMsg = e instanceof CoreError && e.cause instanceof Error ? e.cause.message : '';
      const unauthorized = /401|unauthorized/i.test(`${msg} ${causeMsg}`);
      if (!unauthorized || !this.session.username || this.session.password === undefined) throw e;
      this.session = await authenticate(this.port, {
        serverUrl: this.session.serverUrl,
        username: this.session.username,
        password: this.session.password,
      });
      return await attempt();
    }
  }

  async listChannels(_opts?: ListChannelsOpts): Promise<ChannelPage> {
    const url = withParams(joinUrl(this.session.serverUrl, 'LiveTv/Channels'), {
      EnableImages: 'true',
      ImageTypeLimit: '1',
    });
    const dto = await this.authedJson<{ Items?: JellyfinChannelDto[] }>(url);
    const channels = (dto.Items ?? []).map((item) => this.toChannel(item));
    return { channels, nextCursor: undefined };
  }

  async resolveStream(channelId: string): Promise<StreamUrl> {
    const bare = channelId.replace(/^jf:/, '');
    if (!bare) throw new CoreError('NOT_FOUND', `Jellyfin: bad channel id "${channelId}"`);
    // Jellyfin 12: /LiveTv/Channels/{id}/Play is gone; the HLS live stream
    // is videos/{id}/master.m3u8 (server remuxes even remote IPTV sources).
    // Query-param auth (api_key) is unreliable on 12 — pass the token as an
    // Authorization header; players inject it (hls.js xhrSetup / native
    // source headers). MediaSourceId comes from PlaybackInfo.
    let mediaSourceId: string | undefined;
    try {
      const postJson = this.port.postJson?.bind(this.port);
      const pbi = postJson
        ? await postJson<{ MediaSources?: { Id?: string }[] }>(
            joinUrl(this.session.serverUrl, `Items/${bare}/PlaybackInfo`),
            { UserId: this.session.userId },
            { headers: this.authHeaders(), timeoutMs: 10_000 },
          )
        : undefined;
      mediaSourceId = pbi?.MediaSources?.[0]?.Id ?? undefined;
    } catch {
      // PlaybackInfo is optional; master.m3u8 works without MediaSourceId
      // when the item has a single source.
    }
    const streamUrl = withParams(joinUrl(this.session.serverUrl, `videos/${bare}/master.m3u8`), {
      ...(mediaSourceId ? { MediaSourceId: mediaSourceId } : {}),
    });
    return {
      url: streamUrl,
      kind: 'jellyfin-hls',
      containerHint: 'm3u8',
      headers: {
        // Jellyfin 12 accepts ONLY this header form (X-Emby-Token → 401).
        Authorization: `MediaBrowser Token="${this.session.accessToken}"`,
      },
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
