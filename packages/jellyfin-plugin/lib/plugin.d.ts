import type { SourcePlugin } from '@eagle/core';
import type { JellyfinConfig } from './jellyfin.js';
/** Connection input for the Jellyfin plugin. */
export interface JellyfinInput extends JellyfinConfig {
    label?: string;
}
/** Declarative add-source form: heads render this generically. */
export declare const JELLYFIN_FORM_FIELDS: readonly [{
    readonly key: "serverUrl";
    readonly label: "服务器地址";
    readonly placeholder: "http://192.168.1.10:8096";
}, {
    readonly key: "username";
    readonly label: "用户名";
    readonly placeholder: "admin";
}, {
    readonly key: "password";
    readonly label: "密码";
    readonly secure: true;
}];
/**
 * Jellyfin source plugin. Connect = AuthenticateByName; create =
 * JellyfinSource bound to the persisted session.
 */
export declare const jellyfinPlugin: SourcePlugin;
//# sourceMappingURL=plugin.d.ts.map