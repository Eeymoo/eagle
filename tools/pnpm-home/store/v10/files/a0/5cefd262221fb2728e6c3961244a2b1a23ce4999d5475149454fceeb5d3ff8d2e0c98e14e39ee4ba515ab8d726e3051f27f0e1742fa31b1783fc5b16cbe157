"use strict";
/**
 * EAS Build Hooks for Sentry
 *
 * This module provides utilities for capturing EAS build lifecycle events
 * and sending them to Sentry. It supports the following EAS npm hooks:
 * - eas-build-on-error: Captures build failures
 * - eas-build-on-success: Captures successful builds (optional)
 * - eas-build-on-complete: Captures build completion with metrics
 *
 * @see https://docs.expo.dev/build-reference/npm-hooks/
 */
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
exports.isEASBuild = isEASBuild;
exports.getEASBuildEnv = getEASBuildEnv;
exports.captureEASBuildError = captureEASBuildError;
exports.captureEASBuildSuccess = captureEASBuildSuccess;
exports.captureEASBuildComplete = captureEASBuildComplete;
const core_1 = require("@sentry/core");
const version_1 = require("../version");
const SENTRY_DSN_ENV = 'SENTRY_DSN';
const EAS_BUILD_ENV = 'EAS_BUILD';
/** Checks if the current environment is an EAS Build. */
function isEASBuild() {
    return process.env[EAS_BUILD_ENV] === 'true';
}
/** Gets the EAS build environment variables. */
function getEASBuildEnv() {
    return {
        EAS_BUILD: process.env.EAS_BUILD,
        EAS_BUILD_ID: process.env.EAS_BUILD_ID,
        EAS_BUILD_PLATFORM: process.env.EAS_BUILD_PLATFORM,
        EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE,
        EAS_BUILD_PROJECT_ID: process.env.EAS_BUILD_PROJECT_ID,
        EAS_BUILD_GIT_COMMIT_HASH: process.env.EAS_BUILD_GIT_COMMIT_HASH,
        EAS_BUILD_RUN_FROM_CI: process.env.EAS_BUILD_RUN_FROM_CI,
        EAS_BUILD_STATUS: process.env.EAS_BUILD_STATUS,
        EAS_BUILD_APP_VERSION: process.env.EAS_BUILD_APP_VERSION,
        EAS_BUILD_APP_BUILD_VERSION: process.env.EAS_BUILD_APP_BUILD_VERSION,
        EAS_BUILD_USERNAME: process.env.EAS_BUILD_USERNAME,
        EAS_BUILD_WORKINGDIR: process.env.EAS_BUILD_WORKINGDIR,
    };
}
function getEnvelopeEndpoint(dsn) {
    const { protocol, host, port, path, projectId, publicKey } = dsn;
    const portStr = port ? `:${port}` : '';
    const pathStr = path ? `/${path}` : '';
    return `${protocol}://${host}${portStr}${pathStr}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`;
}
function createEASBuildTags(env) {
    const tags = {};
    if (env.EAS_BUILD_PLATFORM)
        tags['eas.platform'] = env.EAS_BUILD_PLATFORM;
    if (env.EAS_BUILD_PROFILE)
        tags['eas.profile'] = env.EAS_BUILD_PROFILE;
    if (env.EAS_BUILD_ID)
        tags['eas.build_id'] = env.EAS_BUILD_ID;
    if (env.EAS_BUILD_PROJECT_ID)
        tags['eas.project_id'] = env.EAS_BUILD_PROJECT_ID;
    if (env.EAS_BUILD_RUN_FROM_CI)
        tags['eas.from_ci'] = env.EAS_BUILD_RUN_FROM_CI;
    if (env.EAS_BUILD_STATUS)
        tags['eas.status'] = env.EAS_BUILD_STATUS;
    if (env.EAS_BUILD_USERNAME)
        tags['eas.username'] = env.EAS_BUILD_USERNAME;
    return tags;
}
function createEASBuildContext(env) {
    return {
        build_id: env.EAS_BUILD_ID,
        platform: env.EAS_BUILD_PLATFORM,
        profile: env.EAS_BUILD_PROFILE,
        project_id: env.EAS_BUILD_PROJECT_ID,
        git_commit: env.EAS_BUILD_GIT_COMMIT_HASH,
        from_ci: env.EAS_BUILD_RUN_FROM_CI === 'true',
        status: env.EAS_BUILD_STATUS,
        app_version: env.EAS_BUILD_APP_VERSION,
        build_version: env.EAS_BUILD_APP_BUILD_VERSION,
        username: env.EAS_BUILD_USERNAME,
        working_dir: env.EAS_BUILD_WORKINGDIR,
    };
}
function createEnvelope(event, dsn) {
    const envelopeHeaders = JSON.stringify({
        event_id: event.event_id,
        sent_at: new Date().toISOString(),
        dsn: (0, core_1.dsnToString)(dsn),
        sdk: event.sdk,
    });
    const itemHeaders = JSON.stringify({ type: 'event', content_type: 'application/json' });
    const itemPayload = JSON.stringify(event);
    return `${envelopeHeaders}\n${itemHeaders}\n${itemPayload}`;
}
function sendEvent(event, dsn) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = getEnvelopeEndpoint(dsn);
        const envelope = createEnvelope(event, dsn);
        try {
            const response = yield fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-sentry-envelope' },
                body: envelope,
            });
            if (response.status >= 200 && response.status < 300)
                return true;
            console.warn(`[Sentry] Failed to send event: HTTP ${response.status}`);
            return false;
        }
        catch (error) {
            console.error('[Sentry] Failed to send event:', error);
            return false;
        }
    });
}
function getReleaseFromEASEnv(env) {
    // Honour explicit override first
    if (process.env.SENTRY_RELEASE) {
        return process.env.SENTRY_RELEASE;
    }
    // Best approximation without bundle identifier: version+buildNumber
    if (env.EAS_BUILD_APP_VERSION && env.EAS_BUILD_APP_BUILD_VERSION) {
        return `${env.EAS_BUILD_APP_VERSION}+${env.EAS_BUILD_APP_BUILD_VERSION}`;
    }
    return env.EAS_BUILD_APP_VERSION;
}
function createBaseEvent(level, env, customTags) {
    return {
        event_id: (0, core_1.uuid4)(),
        timestamp: Date.now() / 1000,
        platform: 'node',
        level,
        logger: 'eas-build-hook',
        environment: 'eas-build',
        release: getReleaseFromEASEnv(env),
        tags: Object.assign(Object.assign({}, createEASBuildTags(env)), customTags),
        contexts: { eas_build: createEASBuildContext(env), runtime: { name: 'node', version: process.version } },
        sdk: { name: 'sentry.javascript.react-native.eas-build-hooks', version: version_1.SDK_VERSION },
    };
}
/** Captures an EAS build error event. Call this from the eas-build-on-error hook. */
function captureEASBuildError() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        var _a, _b, _c, _d, _e, _f;
        const dsnString = (_a = options.dsn) !== null && _a !== void 0 ? _a : process.env[SENTRY_DSN_ENV];
        if (!dsnString) {
            console.warn('[Sentry] No DSN provided. Set SENTRY_DSN environment variable or pass dsn option.');
            return;
        }
        if (!isEASBuild()) {
            console.warn('[Sentry] Not running in EAS Build environment. Skipping error capture.');
            return;
        }
        const dsn = (0, core_1.makeDsn)(dsnString);
        if (!dsn) {
            console.error('[Sentry] Invalid DSN format.');
            return;
        }
        const env = getEASBuildEnv();
        const errorMessage = (_b = options.errorMessage) !== null && _b !== void 0 ? _b : `EAS Build Failed: ${(_c = env.EAS_BUILD_PLATFORM) !== null && _c !== void 0 ? _c : 'unknown'} (${(_d = env.EAS_BUILD_PROFILE) !== null && _d !== void 0 ? _d : 'unknown'})`;
        const event = createBaseEvent('error', env, Object.assign(Object.assign({}, options.tags), { 'eas.hook': 'on-error' }));
        event.exception = {
            values: [{ type: 'EASBuildError', value: errorMessage, mechanism: { type: 'eas-build-hook', handled: true } }],
        };
        event.fingerprint = ['eas-build-error', (_e = env.EAS_BUILD_PLATFORM) !== null && _e !== void 0 ? _e : 'unknown', (_f = env.EAS_BUILD_PROFILE) !== null && _f !== void 0 ? _f : 'unknown'];
        const success = yield sendEvent(event, dsn);
        if (success)
            console.log('[Sentry] Build error captured.');
    });
}
/** Captures an EAS build success event. Call this from the eas-build-on-success hook. */
function captureEASBuildSuccess() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        var _a, _b, _c, _d, _e, _f;
        if (!options.captureSuccessfulBuilds) {
            console.log('[Sentry] Skipping successful build capture (captureSuccessfulBuilds is false).');
            return;
        }
        const dsnString = (_a = options.dsn) !== null && _a !== void 0 ? _a : process.env[SENTRY_DSN_ENV];
        if (!dsnString) {
            console.warn('[Sentry] No DSN provided. Set SENTRY_DSN environment variable or pass dsn option.');
            return;
        }
        if (!isEASBuild()) {
            console.warn('[Sentry] Not running in EAS Build environment. Skipping success capture.');
            return;
        }
        const dsn = (0, core_1.makeDsn)(dsnString);
        if (!dsn) {
            console.error('[Sentry] Invalid DSN format.');
            return;
        }
        const env = getEASBuildEnv();
        const successMessage = (_b = options.successMessage) !== null && _b !== void 0 ? _b : `EAS Build Succeeded: ${(_c = env.EAS_BUILD_PLATFORM) !== null && _c !== void 0 ? _c : 'unknown'} (${(_d = env.EAS_BUILD_PROFILE) !== null && _d !== void 0 ? _d : 'unknown'})`;
        const event = createBaseEvent('info', env, Object.assign(Object.assign({}, options.tags), { 'eas.hook': 'on-success' }));
        event.message = { formatted: successMessage };
        event.fingerprint = ['eas-build-success', (_e = env.EAS_BUILD_PLATFORM) !== null && _e !== void 0 ? _e : 'unknown', (_f = env.EAS_BUILD_PROFILE) !== null && _f !== void 0 ? _f : 'unknown'];
        const success = yield sendEvent(event, dsn);
        if (success)
            console.log('[Sentry] Build success captured.');
    });
}
/** Captures an EAS build completion event with status. Call this from the eas-build-on-complete hook. */
function captureEASBuildComplete() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        const env = getEASBuildEnv();
        const status = env.EAS_BUILD_STATUS;
        if (status === 'errored') {
            yield captureEASBuildError(options);
            return;
        }
        if (status === 'finished' && options.captureSuccessfulBuilds) {
            yield captureEASBuildSuccess(Object.assign(Object.assign({}, options), { captureSuccessfulBuilds: true }));
            return;
        }
        console.log(`[Sentry] Build completed with status: ${status !== null && status !== void 0 ? status : 'unknown'}. No event captured.`);
    });
}
//# sourceMappingURL=easBuildHooks.js.map