import { SentryCliOptions } from './types';
/**
 * This convoluted function resolves the path to the manually downloaded fallback
 * `sentry-cli` binary in a way that can't be analysed by @vercel/nft.
 *
 * Without this, the binary can be detected as an asset and included by bundlers
 * that use @vercel/nft.
 *
 * @returns The path to the sentry-cli binary
 */
declare function getFallbackBinaryPath(): string;
declare function getDistributionForThisPlatform(): {
    packageName: any;
    subpath: any;
};
/**
 * Throws an error with a message stating that Sentry CLI doesn't support the current platform.
 *
 * @returns nothing. It throws.
 */
declare function throwUnsupportedPlatformError(): void;
/**
 * Overrides the default binary path with a mock value, useful for testing.
 *
 * @param mockPath The new path to the mock sentry-cli binary
 * @deprecated This was used in tests internally and will be removed in the next major version.
 */
declare function mockBinaryPath(mockPath: string): void;
export type OptionsSchema = Record<string, {
    param: string;
    type: 'array' | 'string' | 'number' | 'boolean' | 'inverted-boolean';
    invertedParam?: string;
} | {
    param?: never;
    type: 'array' | 'string' | 'number' | 'boolean' | 'inverted-boolean';
    invertedParam: string;
}>;
/**
 * Serializes command line options into an arguments array.
 *
 * @param schema An options schema required by the command.
 * @param options An options object according to the schema.
 */
declare function serializeOptions(schema: OptionsSchema, options: Record<string, unknown>): string[];
/**
 * Serializes the command and its options into an arguments array.
 *
 * @param command The literal name of the command.
 * @param schema An options schema required by the command.
 * @param options An options object according to the schema.
 * @returns An arguments array that can be passed via command line.
 */
declare function prepareCommand(command: string[], schema: OptionsSchema, options: Record<string, unknown>): string[];
/**
 * Returns the absolute path to the `sentry-cli` binary.
 */
declare function getPath(): string;
/**
 * Runs `sentry-cli` with the given command line arguments.
 *
 * Use {@link prepareCommand} to specify the command and add arguments for command-
 * specific options. For top-level options, use {@link serializeOptions} directly.
 *
 * The returned promise resolves with the standard output of the command invocation
 * including all newlines. In order to parse this output, be sure to trim the output
 * first.
 *
 * If the command failed to execute, the Promise rejects with the error returned by the
 * CLI. This error includes a `code` property with the process exit status.
 *
 * @example
 * const output = await execute(['--version']);
 * expect(output.trim()).toBe('sentry-cli x.y.z');
 *
 * @param args Command line arguments passed to `sentry-cli`.
 * @param live can be set to:
 *  - `true` to inherit stdio and reject the promise if the command
 *    exits with a non-zero exit code.
 *  - `false` to not inherit stdio and return the output as a string.
 * @param silent Disable stdout for silents build (CI/Webpack Stats, ...)
 * @param configFile Relative or absolute path to the configuration file.
 * @param config More configuration to pass to the CLI
 * @returns A promise that resolves to the standard output.
 */
declare function execute(args: string[], live: boolean, silent: boolean, configFile: string | undefined, config?: SentryCliOptions): Promise<string>;
declare function getProjectFlagsFromOptions({ projects }?: {
    projects?: any[];
}): any;
export { execute, getPath, getProjectFlagsFromOptions, mockBinaryPath, prepareCommand, serializeOptions, getDistributionForThisPlatform, throwUnsupportedPlatformError, getFallbackBinaryPath, };
