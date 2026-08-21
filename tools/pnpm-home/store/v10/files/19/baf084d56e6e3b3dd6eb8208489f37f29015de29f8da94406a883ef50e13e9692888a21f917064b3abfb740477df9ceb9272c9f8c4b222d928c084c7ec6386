import { Options } from '../core/index';
type UnsafeBannerPlugin = {
    new (options: any): unknown;
};
type UnsafeDefinePlugin = {
    new (options: any): unknown;
};
type WebpackModule = {
    resource?: string;
};
type WebpackLoaderCallback = (err: Error | null, content?: string, sourceMap?: unknown) => void;
type WebpackLoaderContext = {
    callback: WebpackLoaderCallback;
};
type WebpackCompilationContext = {
    compiler: {
        webpack?: {
            NormalModule?: {
                getCompilationHooks: (compilation: WebpackCompilationContext) => {
                    loader: {
                        tap: (name: string, callback: (loaderContext: WebpackLoaderContext, module: WebpackModule) => void) => void;
                    };
                };
            };
        };
    };
    hooks: {
        normalModuleLoader?: {
            tap: (name: string, callback: (loaderContext: WebpackLoaderContext, module: WebpackModule) => void) => void;
        };
    };
};
type WebpackCompiler = {
    options: {
        plugins?: unknown[];
        mode?: string;
        module?: {
            rules?: unknown[];
        };
    };
    hooks: {
        thisCompilation: {
            tap: (name: string, callback: (compilation: WebpackCompilationContext) => void) => void;
        };
        afterEmit: {
            tapAsync: (name: string, callback: (compilation: WebpackCompilation, cb: () => void) => void) => void;
        };
        done: {
            tap: (name: string, callback: () => void) => void;
        };
    };
    webpack?: {
        BannerPlugin?: UnsafeBannerPlugin;
        DefinePlugin?: UnsafeDefinePlugin;
    };
};
type WebpackCompilation = {
    outputOptions: {
        path?: string;
    };
    assets: Record<string, unknown>;
    hooks: {
        processAssets: {
            tap: (options: {
                name: string;
                stage: number;
            }, callback: () => void) => void;
        };
    };
};
/**
 * The factory function accepts BannerPlugin and DefinePlugin classes in
 * order to avoid direct dependencies on webpack.
 *
 * This allow us to export version of the plugin for webpack 5.1+ and compatible environments.
 *
 * Since webpack 5.1 compiler contains webpack module so plugins always use correct webpack version.
 */
export declare function sentryWebpackPluginFactory({ BannerPlugin: UnsafeBannerPlugin, DefinePlugin: UnsafeDefinePlugin, }?: {
    BannerPlugin?: UnsafeBannerPlugin;
    DefinePlugin?: UnsafeDefinePlugin;
}): (userOptions?: SentryWebpackPluginOptions) => {
    apply(compiler: WebpackCompiler): void;
};
export type SentryWebpackPluginOptions = Options & {
    _experiments?: Options['_experiments'] & {
        /**
         * If enabled, the webpack plugin will exit the build process after the build completes.
         * Use this with caution, as it will terminate the process.
         *
         * More information: https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/345
         *
         * @default false
         */
        forceExitOnBuildCompletion?: boolean;
    };
};
export {};
//# sourceMappingURL=webpack4and5.d.ts.map
