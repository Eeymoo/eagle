import { CodeInjection } from './utils';
/**
 * Determines whether the Sentry CLI binary is in its expected location.
 * This function is useful since `@sentry/cli` installs the binary via a post-install
 * script and post-install scripts may not always run. E.g. with `npm i --ignore-scripts`.
 */
export declare function sentryCliBinaryExists(): boolean;
export declare const COMMENT_USE_STRICT_REGEX: RegExp;
/**
 * Checks if a file is a JavaScript file based on its extension.
 * Handles query strings and hashes in the filename.
 */
export declare function isJsFile(fileName: string): boolean;
/**
 * Checks if a chunk should be skipped for code injection
 *
 * This is necessary to handle Vite's MPA (multi-page application) mode where
 * HTML entry points create "facade" chunks that should not contain injected code.
 * See: https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/829
 *
 * However, in SPA mode, the main bundle also has an HTML facade but contains
 * substantial application code. We should NOT skip injection for these bundles.
 *
 * @param code - The chunk's code content
 * @param facadeModuleId - The facade module ID (if any) - HTML files create facade chunks
 * @returns true if the chunk should be skipped
 */
export declare function shouldSkipCodeInjection(code: string, facadeModuleId: string | null | undefined): boolean;
export { globFiles } from './glob';
export declare function createComponentNameAnnotateHooks(ignoredComponents: string[], injectIntoHtml: boolean): {
    transform(this: void, code: string, id: string): Promise<{
        code: string;
        map: {
            version: number;
            sources: string[];
            names: string[];
            sourceRoot?: string | undefined;
            sourcesContent?: string[] | undefined;
            mappings: string;
            file: string;
        } | null | undefined;
    } | {
        code: string;
        map?: undefined;
    } | null>;
};
export declare function getDebugIdSnippet(debugId: string): CodeInjection;
export type { Logger } from './logger';
export type { Options, SentrySDKBuildFlags } from './types';
export { CodeInjection, replaceBooleanFlagsInCode, stringToUUID, generateReleaseInjectorCode, generateModuleMetadataInjectorCode, } from './utils';
export { createSentryBuildPluginManager } from './build-plugin-manager';
export { createDebugIdUploadFunction } from './debug-id-upload';
//# sourceMappingURL=index.d.ts.map