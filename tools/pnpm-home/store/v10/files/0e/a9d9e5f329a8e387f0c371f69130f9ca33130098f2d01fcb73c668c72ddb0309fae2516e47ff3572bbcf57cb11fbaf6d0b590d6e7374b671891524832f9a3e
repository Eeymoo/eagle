'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceMaps = void 0;
const inject_1 = require("./options/inject");
const helper = require("../helper");
/**
 * Default arguments for the `--ignore` option.
 */
const DEFAULT_IGNORE = ['node_modules'];
/**
 * Manages source map operations on Sentry.
 */
class SourceMaps {
    constructor(options = {}, configFile) {
        this.options = options;
        this.configFile = configFile;
    }
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
    inject(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options || !options.paths || !Array.isArray(options.paths)) {
                throw new Error('`options.paths` must be a valid array of paths.');
            }
            if (options.paths.length === 0) {
                throw new Error('`options.paths` must contain at least one path.');
            }
            const newOptions = Object.assign({}, options);
            if (!newOptions.ignoreFile && !newOptions.ignore) {
                newOptions.ignore = DEFAULT_IGNORE;
            }
            const args = helper.prepareCommand(['sourcemaps', 'inject', ...options.paths], inject_1.INJECT_OPTIONS, newOptions);
            return this.execute(args, true);
        });
    }
    /**
     * See {helper.execute} docs.
     * @param args Command line arguments passed to `sentry-cli`.
     * @param live can be set to:
     *  - `true` to inherit stdio and reject the promise if the command
     *    exits with a non-zero exit code.
     *  - `false` to not inherit stdio and return the output as a string.
     * @returns A promise that resolves to the standard output.
     */
    execute(args, live) {
        return __awaiter(this, void 0, void 0, function* () {
            return helper.execute(args, live, this.options.silent, this.configFile, this.options);
        });
    }
}
exports.SourceMaps = SourceMaps;
