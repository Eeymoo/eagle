import { CoreError } from '@eagle/core';
import { JellyfinSource, authenticate } from './jellyfin.js';
/** Declarative add-source form: heads render this generically. */
export const JELLYFIN_FORM_FIELDS = [
    { key: 'serverUrl', label: '服务器地址', placeholder: 'http://192.168.1.10:8096' },
    { key: 'username', label: '用户名', placeholder: 'admin' },
    { key: 'password', label: '密码', secure: true },
];
/**
 * Jellyfin source plugin. Connect = AuthenticateByName; create =
 * JellyfinSource bound to the persisted session.
 */
export const jellyfinPlugin = {
    kind: 'jellyfin',
    displayName: 'Jellyfin',
    channelIdPrefix: 'jf',
    formFields: JELLYFIN_FORM_FIELDS,
    async connect(port, input) {
        const { label, ...config } = input;
        if (!config.serverUrl || !config.username) {
            throw new CoreError('PARSE', 'Jellyfin: serverUrl and username are required');
        }
        const session = await authenticate(port, config);
        // Persist credentials inside the session for silent re-login when the
        // token gets invalidated (Jellyfin 12 kills older tokens per login).
        const state = { session: { ...session, password: config.password } };
        const id = `jellyfin:${port.hash(config.serverUrl)}`;
        return {
            id,
            label: label ?? config.serverUrl,
            state: state,
        };
    },
    create(port, connection) {
        const { session } = connection.state;
        return new JellyfinSource(port, session, connection.id);
    },
};
//# sourceMappingURL=plugin.js.map