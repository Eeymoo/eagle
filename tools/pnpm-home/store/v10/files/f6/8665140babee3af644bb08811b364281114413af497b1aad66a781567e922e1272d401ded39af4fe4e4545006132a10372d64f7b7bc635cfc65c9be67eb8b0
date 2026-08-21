"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentry = void 0;
exports.getSentryProperties = getSentryProperties;
const config_plugins_1 = require("expo/config-plugins");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const version_1 = require("./version");
const withSentryAndroid_1 = require("./withSentryAndroid");
const withSentryAndroidGradlePlugin_1 = require("./withSentryAndroidGradlePlugin");
const withSentryIOS_1 = require("./withSentryIOS");
/**
 * Store build-time properties in config._internal so they're discoverable
 * by the sourcemap upload script via `expo config --json`, even when
 * withSentry is used programmatically in app.config.ts.
 *
 * We use _internal instead of extra because _internal is stripped from the
 * public config (app manifest) and not shipped in the production app, while
 * extra would leak org/project metadata into the app binary.
 */
function storeBuildPropertiesInConfig(config, props) {
    if (props?.organization || props?.project) {
        // ExpoConfig types don't include _internal, but it's a standard Expo field
        // used by config plugins infrastructure (e.g. pluginHistory).
        const configWithInternal = config;
        configWithInternal._internal = configWithInternal._internal || {};
        configWithInternal._internal.sentryBuildProperties = {
            organization: props?.organization,
            project: props?.project,
            url: props?.url || 'https://sentry.io/',
        };
    }
}
const withSentryPlugin = (config, props) => {
    const sentryProperties = getSentryProperties(props);
    if (props?.authToken) {
        // If not removed, the plugin config with the authToken will be written to the application package
        delete props.authToken;
    }
    storeBuildPropertiesInConfig(config, props);
    let cfg = config;
    const pluginOptions = props?.options ? { ...props.options } : {};
    // oxlint-disable-next-line typescript-eslint(no-unsafe-member-access)
    const environment = process.env.SENTRY_ENVIRONMENT;
    if (environment) {
        pluginOptions.environment = environment;
    }
    if (Object.keys(pluginOptions).length > 0) {
        cfg = withSentryOptionsFile(cfg, pluginOptions);
    }
    if (sentryProperties !== null) {
        try {
            cfg = (0, withSentryAndroid_1.withSentryAndroid)(cfg, {
                sentryProperties,
                useNativeInit: props?.useNativeInit,
                disableAutoUpload: props?.disableAutoUpload,
            });
        }
        catch (e) {
            (0, logger_1.warnOnce)(`There was a problem with configuring your native Android project: ${e}`);
        }
        // if `enableAndroidGradlePlugin` is provided configure the Sentry Android Gradle Plugin
        if (props?.experimental_android?.enableAndroidGradlePlugin) {
            try {
                cfg = (0, withSentryAndroidGradlePlugin_1.withSentryAndroidGradlePlugin)(cfg, props.experimental_android);
            }
            catch (e) {
                (0, logger_1.warnOnce)(`There was a problem with configuring Sentry Android Gradle Plugin: ${e}`);
            }
        }
        try {
            cfg = (0, withSentryIOS_1.withSentryIOS)(cfg, {
                sentryProperties,
                useNativeInit: props?.useNativeInit,
                disableAutoUpload: props?.disableAutoUpload,
            });
        }
        catch (e) {
            (0, logger_1.warnOnce)(`There was a problem with configuring your native iOS project: ${e}`);
        }
    }
    return cfg;
};
const missingProjectMessage = '# no project found, falling back to SENTRY_PROJECT environment variable';
const missingOrgMessage = '# no org found, falling back to SENTRY_ORG environment variable';
const existingAuthTokenMessage = '# DO NOT COMMIT the auth token, use SENTRY_AUTH_TOKEN instead, see https://docs.sentry.io/platforms/react-native/manual-setup/';
const missingAuthTokenMessage = '# Using SENTRY_AUTH_TOKEN environment variable';
function getSentryProperties(props) {
    const { organization, project, authToken, url = 'https://sentry.io/' } = props ?? {};
    const missingProperties = ['organization', 'project'].filter(each => !props?.hasOwnProperty(each));
    if (missingProperties.length) {
        const missingPropertiesString = (0, logger_1.bold)(missingProperties.join(', '));
        const warningMessage = `Missing config for ${missingPropertiesString}. Environment variables will be used as a fallback during the build. https://docs.sentry.io/platforms/react-native/manual-setup/`;
        (0, logger_1.warnOnce)(warningMessage);
    }
    if (authToken) {
        (0, logger_1.warnOnce)(`Detected unsecure use of 'authToken' in Sentry plugin configuration. To avoid exposing the token use ${(0, logger_1.bold)('SENTRY_AUTH_TOKEN')} environment variable instead. https://docs.sentry.io/platforms/react-native/manual-setup/`);
    }
    return `defaults.url=${url}
${organization ? `defaults.org=${organization}` : missingOrgMessage}
${project ? `defaults.project=${project}` : missingProjectMessage}
${authToken ? `${existingAuthTokenMessage}\nauth.token=${authToken}` : missingAuthTokenMessage}`;
}
function withSentryOptionsFile(config, pluginOptions) {
    // withDangerousMod requires a platform key, but sentry.options.json is at the project root.
    // We apply to both platforms so it works with `expo prebuild --platform ios` or `--platform android`.
    let cfg = (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        mod => {
            (0, utils_1.writeSentryOptions)(mod.modRequest.projectRoot, pluginOptions);
            return mod;
        },
    ]);
    cfg = (0, config_plugins_1.withDangerousMod)(cfg, [
        'ios',
        mod => {
            (0, utils_1.writeSentryOptions)(mod.modRequest.projectRoot, pluginOptions);
            return mod;
        },
    ]);
    return cfg;
}
const withSentry = (0, config_plugins_1.createRunOncePlugin)(withSentryPlugin, version_1.PLUGIN_NAME, version_1.PLUGIN_VERSION);
exports.withSentry = withSentry;
