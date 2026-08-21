import { addBreadcrumb, debug, SPAN_STATUS_ERROR, SPAN_STATUS_OK, startInactiveSpan, } from '@sentry/core';
import { SPAN_ORIGIN_AUTO_EXPO_UPDATES } from '../tracing/origin';
import { isExpo, isExpoGo } from '../utils/environment';
const INTEGRATION_NAME = 'ExpoUpdatesListener';
const BREADCRUMB_CATEGORY = 'expo.updates';
/**
 * Tries to load `expo-updates` and retrieve exports needed by this integration.
 * Returns `undefined` if `expo-updates` is not installed.
 */
function getExpoUpdatesExports() {
    try {
        const expoUpdates = require('expo-updates');
        if (typeof expoUpdates.addUpdatesStateChangeListener === 'function') {
            return expoUpdates;
        }
    }
    catch (_) {
        // that happens when expo-updates is not installed
    }
    return undefined;
}
const STATE_TRANSITIONS = [
    { field: 'isChecking', message: 'Checking for update', level: 'info' },
    {
        field: 'isUpdateAvailable',
        message: 'Update available',
        level: 'info',
        getData: ctx => {
            var _a;
            const updateId = (_a = ctx.latestManifest) === null || _a === void 0 ? void 0 : _a.id;
            return updateId ? { updateId } : undefined;
        },
    },
    { field: 'isDownloading', message: 'Downloading update', level: 'info' },
    {
        field: 'isUpdatePending',
        message: 'Update downloaded',
        level: 'info',
        getData: ctx => {
            var _a;
            const updateId = (_a = ctx.downloadedManifest) === null || _a === void 0 ? void 0 : _a.id;
            return updateId ? { updateId } : undefined;
        },
    },
    {
        field: 'checkError',
        message: 'Update check failed',
        level: 'error',
        getData: ctx => ({
            error: ctx.checkError.message || String(ctx.checkError),
        }),
    },
    {
        field: 'downloadError',
        message: 'Update download failed',
        level: 'error',
        getData: ctx => ({
            error: ctx.downloadError.message || String(ctx.downloadError),
        }),
    },
    {
        field: 'rollback',
        message: 'Rollback directive received',
        level: 'warning',
        getData: ctx => ({
            commitTime: ctx.rollback.commitTime,
        }),
    },
    { field: 'isRestarting', message: 'Restarting for update', level: 'info' },
];
/**
 * Listens to Expo Updates native state machine changes and records
 * breadcrumbs and spans for meaningful transitions such as checking
 * for updates, downloading updates, errors, rollbacks, and restarts.
 */
export const expoUpdatesListenerIntegration = () => {
    let subscription;
    let checkSpan;
    let downloadSpan;
    function setup(client) {
        client.on('afterInit', () => {
            var _a;
            if (!isExpo() || isExpoGo()) {
                return;
            }
            const expoUpdates = getExpoUpdatesExports();
            if (!expoUpdates) {
                debug.log('[ExpoUpdatesListener] expo-updates is not available, skipping.');
                return;
            }
            // Clean up any previous state to prevent duplicates
            // if Sentry.init() is called multiple times.
            subscription === null || subscription === void 0 ? void 0 : subscription.remove();
            endSpanAsCancelled(checkSpan);
            checkSpan = undefined;
            endSpanAsCancelled(downloadSpan);
            downloadSpan = undefined;
            // Seed with the current state so that the first event does not
            // generate spurious breadcrumbs for already-truthy fields.
            let previousContext = (_a = expoUpdates.latestContext) !== null && _a !== void 0 ? _a : {};
            subscription = expoUpdates.addUpdatesStateChangeListener((event) => {
                const ctx = event.context;
                const spanResult = handleSpanLifecycle(previousContext, ctx, checkSpan, downloadSpan);
                checkSpan = spanResult.checkSpan;
                downloadSpan = spanResult.downloadSpan;
                handleStateChange(previousContext, ctx);
                previousContext = ctx;
            });
        });
        client.on('close', () => {
            subscription === null || subscription === void 0 ? void 0 : subscription.remove();
            subscription = undefined;
            endSpanAsCancelled(checkSpan);
            checkSpan = undefined;
            endSpanAsCancelled(downloadSpan);
            downloadSpan = undefined;
        });
    }
    return {
        name: INTEGRATION_NAME,
        setup,
    };
};
function endSpanAsCancelled(span) {
    if (span) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: 'cancelled' });
        span.end();
    }
}
/**
 * Manages span lifecycle for check and download operations.
 * Starts spans when operations begin, ends them when they complete or fail.
 *
 * @internal Exposed for testing purposes
 */
export function handleSpanLifecycle(previous, current, currentCheckSpan, currentDownloadSpan) {
    var _a, _b;
    let checkSpan = currentCheckSpan;
    let downloadSpan = currentDownloadSpan;
    if (!previous.isChecking && current.isChecking) {
        checkSpan = startInactiveSpan({
            name: 'expo-updates check',
            op: 'app.update.check',
            forceTransaction: true,
            attributes: { 'sentry.origin': SPAN_ORIGIN_AUTO_EXPO_UPDATES },
        });
    }
    else if (previous.isChecking && !current.isChecking && checkSpan) {
        endSpanWithResult(checkSpan, current.checkError, 'check_error', current.isUpdateAvailable ? (_a = current.latestManifest) === null || _a === void 0 ? void 0 : _a.id : undefined);
        checkSpan = undefined;
    }
    if (!previous.isDownloading && current.isDownloading) {
        downloadSpan = startInactiveSpan({
            name: 'expo-updates download',
            op: 'app.update.download',
            forceTransaction: true,
            attributes: { 'sentry.origin': SPAN_ORIGIN_AUTO_EXPO_UPDATES },
        });
    }
    else if (previous.isDownloading && !current.isDownloading && downloadSpan) {
        endSpanWithResult(downloadSpan, current.downloadError, 'download_error', current.isUpdatePending ? (_b = current.downloadedManifest) === null || _b === void 0 ? void 0 : _b.id : undefined);
        downloadSpan = undefined;
    }
    return { checkSpan, downloadSpan };
}
function endSpanWithResult(span, error, fallbackMessage, updateId) {
    if (error) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: error.message || fallbackMessage });
    }
    else {
        span.setStatus({ code: SPAN_STATUS_OK });
        if (updateId) {
            span.setAttribute('expo.update.id', updateId);
        }
    }
    span.end();
}
/**
 * Compares previous and current state machine contexts and emits
 * breadcrumbs for meaningful transitions (falsy→truthy).
 *
 * @internal Exposed for testing purposes
 */
export function handleStateChange(previous, current) {
    var _a;
    for (const transition of STATE_TRANSITIONS) {
        if (!previous[transition.field] && current[transition.field]) {
            addBreadcrumb({
                category: BREADCRUMB_CATEGORY,
                message: transition.message,
                level: transition.level,
                data: (_a = transition.getData) === null || _a === void 0 ? void 0 : _a.call(transition, current),
            });
        }
    }
}
//# sourceMappingURL=expoupdateslistener.js.map