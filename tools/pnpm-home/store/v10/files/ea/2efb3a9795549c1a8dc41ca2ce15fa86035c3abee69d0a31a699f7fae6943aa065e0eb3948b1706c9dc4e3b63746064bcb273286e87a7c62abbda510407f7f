"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentryOptionsFromFile = withSentryOptionsFromFile;
const core_1 = require("@sentry/core");
const fs = require("fs");
const path = require("path");
const utils_1 = require("./utils");
const countLines_1 = require("./vendor/metro/countLines");
const DEFAULT_OPTIONS_FILE_NAME = 'sentry.options.json';
/**
 * Loads Sentry options from a file in
 */
function withSentryOptionsFromFile(config, optionsFile) {
    var _a;
    if (optionsFile === false) {
        return config;
    }
    const { projectRoot } = config;
    if (!projectRoot) {
        // oxlint-disable-next-line eslint(no-console)
        console.error('[@sentry/react-native/metro] Project root is required to load Sentry options from a file');
        return config;
    }
    let optionsPath = path.join(projectRoot, DEFAULT_OPTIONS_FILE_NAME);
    if (typeof optionsFile === 'string' && path.isAbsolute(optionsFile)) {
        optionsPath = optionsFile;
    }
    else if (typeof optionsFile === 'string') {
        optionsPath = path.join(projectRoot, optionsFile);
    }
    const originalSerializer = (_a = config.serializer) === null || _a === void 0 ? void 0 : _a.customSerializer;
    if (!originalSerializer) {
        // It's okay to bail here because we don't expose this for direct usage, but as part of `withSentryConfig`
        // If used directly in RN, the user is responsible for providing a custom serializer first, Expo provides serializer in default config
        // oxlint-disable-next-line eslint(no-console)
        console.error('[@sentry/react-native/metro] `config.serializer.customSerializer` is required to load Sentry options from a file');
        return config;
    }
    const sentryOptionsSerializer = (entryPoint, preModules, graph, options) => {
        const sentryOptionsModule = createSentryOptionsModule(optionsPath);
        if (sentryOptionsModule) {
            preModules.push(sentryOptionsModule);
        }
        return originalSerializer(entryPoint, preModules, graph, options);
    };
    // Preserve Expo's __originalSerializer marker so Expo can detect user-provided serializers
    if ('__originalSerializer' in originalSerializer) {
        Object.assign(sentryOptionsSerializer, {
            __originalSerializer: originalSerializer.__originalSerializer,
        });
    }
    // @ts-expect-error customSerializer is typed read only in metro 0.84+
    config.serializer.customSerializer = sentryOptionsSerializer;
    return config;
}
function createSentryOptionsModule(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            core_1.logger.debug(`[@sentry/react-native/metro] Sentry options file does not exist at ${filePath}`);
        }
        else {
            core_1.logger.error(`[@sentry/react-native/metro] Failed to read Sentry options file at ${filePath}`);
        }
        return null;
    }
    let parsedContent;
    try {
        parsedContent = JSON.parse(content);
    }
    catch (error) {
        core_1.logger.error(`[@sentry/react-native/metro] Failed to parse Sentry options file at ${filePath}`);
        return null;
    }
    applySentryOptionsEnvOverrides(parsedContent);
    const minifiedContent = JSON.stringify(parsedContent);
    const optionsCode = `var __SENTRY_OPTIONS__=${minifiedContent};`;
    core_1.logger.debug(`[@sentry/react-native/metro] Sentry options added to the bundle from file at ${filePath}`);
    return {
        dependencies: new Map(),
        getSource: () => Buffer.from(optionsCode),
        inverseDependencies: (0, utils_1.createSet)(),
        path: '__sentry-options__',
        output: [
            {
                type: 'js/script/virtual',
                data: {
                    code: optionsCode,
                    lineCount: (0, countLines_1.default)(optionsCode),
                    map: [],
                },
            },
        ],
    };
}
/**
 * Applies the `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` and `SENTRY_DIST` build-time overrides to the
 * options bundled into the JS (`__SENTRY_OPTIONS__`).
 *
 * The native build steps (`sentry-xcode.sh`, `sentry.gradle.kts`) already apply these env variables
 * to the native copy of `sentry.options.json`. Without mirroring them here, the native SDK (which owns
 * release health sessions on mobile) and the JS layer can end up with a different `environment`,
 * `release` or `dist`, splitting session and event data across releases/environments.
 */
function applySentryOptionsEnvOverrides(options) {
    // The options file is expected to contain a JSON object. Guard against valid-but-unexpected JSON
    // (e.g. a primitive or `null`), where assigning a property would throw in strict mode.
    if (typeof options !== 'object' || options === null) {
        return;
    }
    if (process.env.SENTRY_ENVIRONMENT) {
        options.environment = process.env.SENTRY_ENVIRONMENT;
        core_1.logger.debug(`[@sentry/react-native/metro] Overriding 'environment' from SENTRY_ENVIRONMENT environment variable`);
    }
    if (process.env.SENTRY_RELEASE) {
        options.release = process.env.SENTRY_RELEASE;
        core_1.logger.debug(`[@sentry/react-native/metro] Overriding 'release' from SENTRY_RELEASE environment variable`);
    }
    if (process.env.SENTRY_DIST) {
        options.dist = process.env.SENTRY_DIST;
        core_1.logger.debug(`[@sentry/react-native/metro] Overriding 'dist' from SENTRY_DIST environment variable`);
    }
}
//# sourceMappingURL=sentryOptionsSerializer.js.map