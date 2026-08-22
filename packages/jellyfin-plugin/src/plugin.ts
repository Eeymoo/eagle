import type { Port, SourcePlugin } from '@eagle/core';
import { CoreError } from '@eagle/core';
import { JellyfinSource, authenticate } from './jellyfin.js';
import type { JellyfinConfig, JellyfinSession } from './jellyfin.js';

/** Connection input for the Jellyfin plugin. */
export interface JellyfinInput extends JellyfinConfig {
  label?: string;
}

/** Declarative add-source form: heads render this generically. */
export const JELLYFIN_FORM_FIELDS = [
  { key: 'serverUrl', label: '服务器地址', placeholder: 'http://192.168.1.10:8096' },
  { key: 'username', label: '用户名', placeholder: 'admin' },
  { key: 'password', label: '密码', secure: true },
] as const;

/**
 * Jellyfin source plugin. Connect = AuthenticateByName; create =
 * JellyfinSource bound to the persisted session.
 */
export const jellyfinPlugin: SourcePlugin = {
  kind: 'jellyfin',
  displayName: 'Jellyfin',
  channelIdPrefix: 'jf',
  formFields: JELLYFIN_FORM_FIELDS,

  async connect(port: Port, input) {
    const { label, ...config } = input as unknown as JellyfinInput;
    if (!config.serverUrl || !config.username) {
      throw new CoreError('PARSE', 'Jellyfin: serverUrl and username are required');
    }
    // Distinct DeviceId per source kind: Jellyfin 12 invalidates the previous
    // token PER DEVICE on login — a shared id made live + video sources kick
    // each other into a 401 loop.
    const deviceId = `eagle-live-${port.hash(config.serverUrl)}`;
    const session = await authenticate(port, { ...config, deviceId });
    // Persist credentials inside the session for silent re-login when the
    // token gets invalidated (Jellyfin 12 kills older tokens per login).
    const state = { session: { ...session, password: config.password } };
    const id = `jellyfin:${port.hash(config.serverUrl)}`;
    return {
      id,
      label: label ?? config.serverUrl,
      state: state as unknown as Record<string, unknown>,
    };
  },

  create(port: Port, connection) {
    const { session } = connection.state as unknown as { session: JellyfinSession };
    // Backfill: sources persisted before per-device ids existed shared one
    // device slot (401 loop); claim a private slot on first rehydrate.
    session.deviceId ??= `eagle-live-${port.hash(session.serverUrl)}`;
    return new JellyfinSource(port, session, connection.id);
  },
};
