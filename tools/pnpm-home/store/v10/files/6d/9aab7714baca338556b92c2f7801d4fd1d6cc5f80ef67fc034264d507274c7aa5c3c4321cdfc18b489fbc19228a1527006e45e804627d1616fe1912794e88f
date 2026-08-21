import { Options } from '../core';
import { ComponentAnnotationTransformMeta } from '../core/component-annotation-vite';
import { SourceMap } from 'magic-string';
import MagicString from 'magic-string';
type TransformResult = {
    code: string;
    map?: SourceMap | string | {
        mappings: string;
    } | null;
} | null | undefined;
/**
 * @ignore - this is the internal plugin factory function only used for the Vite plugin!
 */
export declare function _rollupPluginInternal(userOptions: Options | undefined, buildTool: 'rollup' | 'vite', buildToolMajorVersion?: string): {
    name: string;
    buildStart?: undefined;
    transform?: undefined;
    renderChunk?: undefined;
    writeBundle?: undefined;
} | {
    name: string;
    buildStart: () => void;
    transform: ((code: string, id: string, meta?: ComponentAnnotationTransformMeta) => Promise<TransformResult>) | {
        filter: {
            id: RegExp;
        };
        handler: (code: string, id: string, meta?: ComponentAnnotationTransformMeta) => Promise<TransformResult>;
    };
    renderChunk: (code: string, chunk: {
        fileName: string;
        facadeModuleId?: string | null;
    }, _?: unknown, meta?: {
        magicString?: MagicString;
    }) => {
        code: string;
        map?: SourceMap;
    } | null;
    writeBundle: (outputOptions: {
        dir?: string;
        file?: string;
    }, bundle: {
        [fileName: string]: unknown;
    }) => Promise<void>;
} | {
    name: string;
    buildStart: () => void;
    renderChunk: (code: string, chunk: {
        fileName: string;
        facadeModuleId?: string | null;
    }, _?: unknown, meta?: {
        magicString?: MagicString;
    }) => {
        code: string;
        map?: SourceMap;
    } | null;
    writeBundle: (outputOptions: {
        dir?: string;
        file?: string;
    }, bundle: {
        [fileName: string]: unknown;
    }) => Promise<void>;
    transform?: undefined;
};
export declare function sentryRollupPlugin(userOptions?: Options): any;
export { Options as SentryRollupPluginOptions } from '../core';
export { sentryCliBinaryExists } from '../core';
//# sourceMappingURL=index.d.ts.map
