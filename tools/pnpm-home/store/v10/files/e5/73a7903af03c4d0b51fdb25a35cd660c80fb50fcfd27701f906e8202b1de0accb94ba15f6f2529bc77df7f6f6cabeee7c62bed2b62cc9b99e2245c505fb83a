import { SentryCliCommitsOptions, SentryCliNewDeployOptions, SentryCliOptions, SentryCliUploadSourceMapsOptions } from '../types';
/**
 * Manages releases and release artifacts on Sentry.
 */
export declare class Releases {
    options: SentryCliOptions;
    private configFile;
    constructor(options: SentryCliOptions, configFile: string | null);
    /**
     * Registers a new release with sentry.
     *
     * The given release name should be unique and deterministic. It can later be used to
     * upload artifacts, such as source maps.
     *
     * @param release Unique name of the new release.
     * @param options The list of project slugs for a release.
     * @returns A promise that resolves when the release has been created.
     */
    new(release: string, options: {
        projects?: string[];
    }): Promise<string>;
    /**
     * Specifies the set of commits covered in this release.
     *
     * @param release Unique name of the release
     * @param options A set of options to configure the commits to include
     * @returns A promise that resolves when the commits have been associated
     */
    setCommits(release: string, options: SentryCliCommitsOptions): Promise<string>;
    /**
     * Marks this release as complete. This should be called once all artifacts has been
     * uploaded.
     *
     * @param release Unique name of the release.
     * @returns A promise that resolves when the release has been finalized.
     */
    finalize(release: string): Promise<string>;
    /**
     * Creates a unique, deterministic version identifier based on the project type and
     * source files. This identifier can be used as release name.
     *
     * @returns A promise that resolves to the version string.
     */
    proposeVersion(): Promise<string>;
    /**
     * Scans the given include folders for JavaScript source maps and uploads them to the
     * specified release for processing.
     *
     * The options require an `include` array, which is a list of directories to scan.
     * Additionally, it supports to ignore certain files, validate and preprocess source
     * maps and define a URL prefix.
     *
     * @example
     * await cli.releases.uploadSourceMaps(cli.releases.proposeVersion(), {
     *   // required options:
     *   include: ['build'],
     *
     *   // default options:
     *   ignore: ['node_modules'],  // globs for files to ignore
     *   ignoreFile: null,          // path to a file with ignore rules
     *   rewrite: false,            // preprocess sourcemaps before uploading
     *   sourceMapReference: true,  // add a source map reference to source files
     *   dedupe: true,              // deduplicate already uploaded files
     *   stripPrefix: [],           // remove certain prefixes from filenames
     *   stripCommonPrefix: false,  // guess common prefixes to remove from filenames
     *   validate: false,           // validate source maps and cancel the upload on error
     *   urlPrefix: '',             // add a prefix source map urls after stripping them
     *   urlSuffix: '',             // add a suffix source map urls after stripping them
     *   ext: ['js', 'map', 'jsbundle', 'bundle'],  // override file extensions to scan for
     *   projects: ['node'],        // provide a list of projects
     *   decompress: false          // decompress gzip files before uploading
     * });
     *
     * @param release Unique name of the release.
     * @param options Options to configure the source map upload.
     * @returns A promise that resolves when the upload has completed successfully.
     */
    uploadSourceMaps(release: string, options: SentryCliUploadSourceMapsOptions): Promise<string[]>;
    /**
     * List all deploys for a given release.
     *
     * @param release Unique name of the release.
     * @returns A promise that resolves when the list comes back from the server.
     */
    listDeploys(release: string): Promise<string>;
    /**
     * Creates a new release deployment. This should be called after the release has been
     * finalized, while deploying on a given environment.
     *
     * @example
     * await cli.releases.newDeploy(cli.releases.proposeVersion(), {
     *   // required options:
     *   env: 'production',          // environment for this release. Values that make sense here would be 'production' or 'staging'
     *
     *   // optional options:
     *   started: 42,                // unix timestamp when the deployment started
     *   finished: 1337,             // unix timestamp when the deployment finished
     *   time: 1295,                 // deployment duration in seconds. This can be specified alternatively to `started` and `finished`
     *   name: 'PickleRick',         // human readable name for this deployment
     *   url: 'https://example.com', // URL that points to the deployment
     *   projects: ['project1', 'project2'], // list of projects to deploy to
     * });
     *
     * @param release Unique name of the release.
     * @param options Options to configure the new release deploy.
     * @returns A promise that resolves when the deploy has been created.
     */
    newDeploy(release: string, options: SentryCliNewDeployOptions): Promise<string>;
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
