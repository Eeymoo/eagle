import { Releases } from './releases';
import { SourceMaps } from './sourceMaps';
import type { SentryCliOptions } from './types';
export type { SentryCliOptions, SentryCliUploadSourceMapsOptions, SourceMapsPathDescriptor, SentryCliNewDeployOptions, SentryCliCommitsOptions, SentryCliInjectOptions, } from './types';
/**
 * Interface to and wrapper around the `sentry-cli` executable.
 *
 * Commands are grouped into namespaces. See the respective namespaces for more
 * documentation. To use this wrapper, simply create an instance and call methods:
 *
 * @example
 * const cli = new SentryCli();
 * console.log(SentryCli.getVersion());
 *
 * @example
 * const cli = new SentryCli('path/to/custom/sentry.properties');
 * const release = await cli.releases.proposeVersion());
 * console.log(release);
 */
export declare class SentryCli {
    configFile: string | null;
    options: SentryCliOptions;
    releases: Releases;
    sourceMaps: SourceMaps;
    /**
     * Creates a new `SentryCli` instance.
     *
     * If the `configFile` parameter is specified, configuration located in the default
     * location and the value specified in the `SENTRY_PROPERTIES` environment variable is
     * overridden.
     *
     * @param configFile Path to Sentry CLI config properties, as described in https://docs.sentry.io/learn/cli/configuration/#properties-files.
     * By default, the config file is looked for upwards from the current path and defaults from ~/.sentryclirc are always loaded.
     * A URL and a non-embedded auth token must be configured in the same file or through runtime options and environment variables.
     * This value will update `SENTRY_PROPERTIES` env variable.
     * @param options More options to pass to the CLI
     */
    constructor(configFile: string | null, options: SentryCliOptions);
    /**
     * Returns the version of the installed `sentry-cli` binary.
     */
    static getVersion(): string;
    /**
     * Returns an absolute path to the `sentry-cli` binary.
     */
    static getPath(): string;
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
