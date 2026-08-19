import type { LiveSource } from './source.js';
import type { Port, SettingsStore } from './types.js';

/**
 * Extension contract for source plugins (Cordis-style plugin object).
 *
 * Core knows nothing about Jellyfin / M3U Tuner / HDHomeRun — every concrete
 * source ships as its own package depending on @eagle/core, and registers a
 * SourcePlugin with the EagleCore registry at bootstrap:
 *
 *   core.use(jellyfinPlugin)      // packages/jellyfin-plugin
 *   core.use(m3uTunerPlugin)      // packages/m3u-tuner-plugin
 *   core.use(hdHomeRunPlugin)     // packages/hdhome-run-plugin
 *
 * Dependency direction: source plugins → core. Core never imports a plugin.
 */

/** Plugin-specific connection input (validated by the plugin itself). */
export type PluginConfig = Record<string, unknown>;

/** One input field a plugin needs in its "add source" form. */
export interface PluginFormField {
  /** Key in the PluginConfig passed to connect(). */
  key: string;
  /** Human label (display string). */
  label: string;
  /** Mask the input (passwords / tokens). */
  secure?: boolean;
  placeholder?: string;
}

/** Result of a successful plugin `connect`. */
export interface PluginConnection {
  /** Unique source instance id, derived by the plugin (should be stable). */
  id: string;
  /** Human label for settings screens. */
  label: string;
  /** Opaque plugin-owned state persisted via SettingsStore for rehydration. */
  state: PluginConfig;
}

/**
 * A source plugin: identity + connection + factory. `kind` doubles as the
 * channel-id namespace (see LiveSource.channelIdPrefix routing).
 */
export interface SourcePlugin {
  /** Unique plugin id, e.g. 'jellyfin' | 'm3u-tuner' | 'hdhome-run'. */
  readonly kind: string;
  /** Display name for UI (English canonical term). */
  readonly displayName: string;
  /**
   * Declarative form fields for the "add source" UI. Heads render these
   * generically; plugins own the structure, heads own the styling.
   */
  readonly formFields?: readonly PluginFormField[];
  /**
   * Channel-id prefix this plugin's LiveSource mints, e.g. 'jf'. EagleCore
   * routes resolveStream() calls by this prefix.
   */
  readonly channelIdPrefix: string;
  /**
   * Validate plugin-specific input, perform login/discovery, and return the
   * persisted connection state plus the LiveSource instance.
   */
  connect(port: Port, input: PluginConfig): Promise<PluginConnection>;
  /** Rehydrate a LiveSource from persisted connection state. */
  create(port: Port, connection: PluginConnection): LiveSource;
}
