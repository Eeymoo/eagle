/**
 * Eagle core — shared, platform-agnostic primitives.
 *
 * Nothing in this file may import `react-native`, `@tauri-apps/*`, DOM or Node
 * APIs. Anything environment-specific is expressed as a capability interface
 * (see `Port`) that the active UI plugin injects at bootstrap.
 */
/** Unified error type thrown by every core API. */
export class CoreError extends Error {
    code;
    cause;
    constructor(code, message, cause) {
        super(message);
        this.name = 'CoreError';
        this.code = code;
        this.cause = cause;
    }
}
export const CHANNEL_LIST_PAGE_SIZE = 200;
//# sourceMappingURL=types.js.map