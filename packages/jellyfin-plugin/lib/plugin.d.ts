import type { SourcePlugin } from '@eagle/core';
import type { JellyfinConfig } from './jellyfin.js';
/** Connection input for the Jellyfin plugin. */
export interface JellyfinInput extends JellyfinConfig {
    label?: string;
}
/**
 * Jellyfin source plugin. Connect = AuthenticateByName; create =
 * JellyfinSource bound to the persisted session.
 */
export declare const jellyfinPlugin: SourcePlugin;
//# sourceMappingURL=plugin.d.ts.map