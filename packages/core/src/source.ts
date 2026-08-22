import type { Channel, ChannelPage, CoreError, SourceKind, StreamUrl } from './types.js';
import type { Port } from './types.js';

/** Options accepted by LiveSource.listChannels. */
export interface ListChannelsOpts {
  /** Opaque cursor from the previous page (future: large channel lists). */
  cursor?: string;
  /** Bypass source-level caches. */
  force?: boolean;
}

/**
 * Contract every live-TV source must fulfil. Core-generic services (channel
 * merge, search, playback resolution) are written against this interface only.
 */
export interface LiveSource {
  readonly kind: SourceKind;
  /** Id of the configured source instance this object is bound to. */
  readonly sourceId: string;

  /** Fetch one page of channels. */
  listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;

  /**
   * Resolve a channel to a playable URL. May hit the network (Jellyfin
   * playback-info, HDHomeRun tune) or be pure (M3U urls are inline).
   */
  resolveStream(channelId: string): Promise<StreamUrl>;

  /** Optional search hint; default implementation filters by name. */
  searchChannels?(query: string): Promise<Channel[]>;
}

/** Convenience base with default name-filtering search. */
export abstract class LiveSourceBase implements LiveSource {
  abstract readonly kind: SourceKind;
  abstract readonly sourceId: string;
  abstract listChannels(opts?: ListChannelsOpts): Promise<ChannelPage>;
  abstract resolveStream(channelId: string): Promise<StreamUrl>;

  async searchChannels(query: string): Promise<Channel[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const { channels } = await this.listChannels();
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }
}

/** Event emitted by EagleCore whenever channel data changes. */
export interface ChannelsChangedEvent {
  type: 'channels-changed';
  /** Source ids whose data changed; empty array = all sources. */
  sourceIds: string[];
}

export type EagleEvent = ChannelsChangedEvent;

/** Factory signature for constructing a LiveSource from a Port. */
export type LiveSourceFactory = (port: Port) => LiveSource;

export interface EagleCoreOptions {
  port: Port;
  settings: SettingsLike;
  /** Factories of sources to expose initially. */
  sources?: LiveSourceFactory[];
}

/** SettingsStore without the `remove` requirement (MVP simplification). */
export interface SettingsLike {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export type { Channel, ChannelPage, CoreError, SourceKind, StreamUrl };

// ---------------------------------------------------------------------------
// Optional media-library capability (VOD-style sources, e.g. Jellyfin
// media libraries). Sources implement this to expose a Jellyfin-like
// modular library: libraries ("我的媒体"), recently added, series trees.
// Heads detect the capability via `implementsLibrary(source)`.
// ---------------------------------------------------------------------------

/** One library entry as shown in "我的媒体" (movies / tvshows / …). */
export interface MediaLibrary {
  /** Server-side folder id (ParentId for item queries). */
  id: string;
  name: string;
  /** Jellyfin CollectionType: movies / tvshows / music / boxsets / … */
  kind: string;
  itemCount: number;
  /** Original library artwork (Primary image) for the card background. */
  posterUrl?: string;
}

/** A browsable item inside a library (movie, series, or episode). */
export interface LibraryItem {
  /** The Eagle channel id (playable via resolveStream), e.g. "jfv:abc". */
  channelId: string;
  title: string;
  /** e.g. "(2021)" for movies, "S01E04" context for episodes. */
  subtitle?: string;
  posterUrl?: string;
  year?: number;
  /** ISO date the server added the item (recently-added sorting). */
  addedAt?: string;
  kind: 'movie' | 'series' | 'episode';
  /** For episodes: the series item id (drill into series detail). */
  seriesId?: string;
  /** Synopsis / overview text (Infuse-style detail pages). */
  overview?: string;
  /** Community rating, 0-10 (e.g. 7.8). */
  rating?: number;
  /** Runtime in minutes. */
  runtimeMin?: number;
  /** Genres. */
  genres?: string[];
}

/** Optional capability for media-library sources. */
export interface LibrarySource {
  /** Libraries ("views") for "我的媒体" — skip non-video libraries. */
  listLibraries(): Promise<MediaLibrary[]>;
  /** Recently added items (mixed movies + new episodes), newest first. */
  listRecentlyAdded(limit?: number): Promise<LibraryItem[]>;
  /** Items of one library (movies wall / series wall). */
  listLibraryItems(viewId: string): Promise<LibraryItem[]>;
  /** Episodes of one series, season/episode ordered. */
  listEpisodes(seriesChannelOrItemId: string): Promise<LibraryItem[]>;
}

/** Type guard: does this source expose the media-library capability? */
export function implementsLibrary(source: LiveSource): source is LiveSource & LibrarySource {
  return (
    typeof (source as LiveSource & Partial<LibrarySource>).listLibraries === 'function' &&
    typeof (source as LiveSource & Partial<LibrarySource>).listLibraryItems === 'function'
  );
}
