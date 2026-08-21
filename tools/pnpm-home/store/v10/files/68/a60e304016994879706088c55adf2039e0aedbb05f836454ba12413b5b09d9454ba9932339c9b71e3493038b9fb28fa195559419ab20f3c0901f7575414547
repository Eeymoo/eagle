import { SentryCliInjectOptions, SentryCliOptions } from '../types';
/**
 * Manages source map operations on Sentry.
 */
export declare class SourceMaps {
    options: SentryCliOptions;
    private configFile;
    constructor(options: SentryCliOptions, configFile: string | null);
    /**
     * Fixes up JavaScript source files and source maps with debug ids.
     *
     * For every minified JS source file, a debug id is generated and
     * inserted into the file. If the source file references a
     * source map and that source map is locally available,
     * the debug id will be injected into it as well.
     * If the referenced source map already contains a debug id,
     * that id is used instead.
     *
     * @example
     * await cli.sourceMaps.inject({
     *   // required options:
     *   paths: ['./dist'],
     *
     *   // default options:
     *   ignore: ['node_modules'],  // globs for files to ignore
     *   ignoreFile: null,          // path to a file with ignore rules
     *   ext: ['js', 'cjs', 'mjs'], // file extensions to consider
     *   dryRun: false,             // don't modify files on disk
     * });
     *
     * @param options Options to configure the debug id injection.
     * @returns A promise that resolves when the injection has completed successfully.
     */
    inject(options: SentryCliInjectOptions): Promise<string>;
    /**
     * See {helper.execute} docs.
     * @param args Command line arguments passed to `sentry-cli`.
     * @param live can be set to:
     *  - `true` to inherit stdio and reject the promise if the command
     *    exits with a non-zero exit code.
     *  - `false` to not inherit stdio and return the output as a string.
     * @returns A promise that resolves to the standard output.
     */
    execute(args: string[], live: boolean): Promise<string>;
}
