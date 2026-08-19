import { CoreError } from '@eagle/core';
import { JellyfinSource, authenticate } from './jellyfin.js';
/**
 * Jellyfin source plugin. Connect = AuthenticateByName; create =
 * JellyfinSource bound to the persisted session.
 */
export const jellyfinPlugin = {
    kind: 'jellyfin',
    displayName: 'Jellyfin',
    channelIdPrefix: 'jf',
    async connect(port, input) {
        const { label, ...config } = input;
        if (!config.serverUrl || !config.username) {
            throw new CoreError('PARSE', 'Jellyfin: serverUrl and username are required');
        }
        const session = await authenticate(port, config);
        const id = `jellyfin:${port.hash(config.serverUrl)}`;
        return {
            id,
            label: label ?? config.serverUrl,
            state: { session },
        };
    },
    create(port, connection) {
        const { session } = connection.state;
        return new JellyfinSource(port, session, connection.id);
    },
};
//# sourceMappingURL=plugin.js.map