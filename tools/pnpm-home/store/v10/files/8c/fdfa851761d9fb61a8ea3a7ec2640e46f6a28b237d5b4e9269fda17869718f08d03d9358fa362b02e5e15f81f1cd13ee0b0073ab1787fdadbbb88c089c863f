var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug, severityLevelFromString } from '@sentry/core';
import { AppState } from 'react-native';
import { breadcrumbFromObject } from '../breadcrumb';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'DeviceContext';
/** Load device context from native. */
export const deviceContextIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            /* noop */
        },
        processEvent,
    };
};
function processEvent(event, _hint, client) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let native = null;
        try {
            native = yield NATIVE.fetchNativeDeviceContexts();
        }
        catch (e) {
            debug.log(`Failed to get device context from native: ${e}`);
        }
        if (!native) {
            return event;
        }
        const nativeUser = native.user;
        if (!event.user && nativeUser) {
            event.user = nativeUser;
        }
        let nativeContexts = native.contexts;
        if (AppState.currentState !== 'unknown') {
            nativeContexts = nativeContexts || {};
            nativeContexts.app = Object.assign(Object.assign({}, nativeContexts.app), { in_foreground: AppState.currentState === 'active' });
        }
        if (nativeContexts) {
            event.contexts = Object.assign(Object.assign({}, nativeContexts), event.contexts);
            if (nativeContexts.app) {
                event.contexts.app = Object.assign(Object.assign({}, nativeContexts.app), event.contexts.app);
            }
        }
        const nativeTags = native.tags;
        if (nativeTags) {
            event.tags = Object.assign(Object.assign({}, nativeTags), event.tags);
        }
        const nativeExtra = native.extra;
        if (nativeExtra) {
            event.extra = Object.assign(Object.assign({}, nativeExtra), event.extra);
        }
        const nativeFingerprint = native.fingerprint;
        if (nativeFingerprint) {
            event.fingerprint = ((_a = event.fingerprint) !== null && _a !== void 0 ? _a : []).concat(nativeFingerprint.filter(item => { var _a; return ((_a = event.fingerprint) !== null && _a !== void 0 ? _a : []).indexOf(item) < 0; }));
        }
        const nativeLevel = typeof native['level'] === 'string' ? severityLevelFromString(native['level']) : undefined;
        if (!event.level && nativeLevel) {
            event.level = nativeLevel;
        }
        const nativeEnvironment = native['environment'];
        if (!event.environment && nativeEnvironment) {
            event.environment = nativeEnvironment;
        }
        const nativeBreadcrumbs = Array.isArray(native['breadcrumbs'])
            ? native['breadcrumbs'].map(breadcrumbFromObject)
            : undefined;
        if (nativeBreadcrumbs) {
            const maxBreadcrumbs = (_b = client === null || client === void 0 ? void 0 : client.getOptions().maxBreadcrumbs) !== null && _b !== void 0 ? _b : 100; // Default is 100.
            const dedupedNativeBreadcrumbs = deduplicateNativeHttpBreadcrumbs(nativeBreadcrumbs, event.breadcrumbs || []);
            event.breadcrumbs = dedupedNativeBreadcrumbs
                .concat(event.breadcrumbs || [])
                .sort((a, b) => { var _a, _b; return ((_a = a.timestamp) !== null && _a !== void 0 ? _a : 0) - ((_b = b.timestamp) !== null && _b !== void 0 ? _b : 0); })
                .slice(-maxBreadcrumbs);
        }
        return event;
    });
}
const HTTP_BREADCRUMB_DEDUP_TIMESTAMP_TOLERANCE_SECONDS = 2;
/**
 * Removes native HTTP breadcrumbs that are duplicates of JS XHR/fetch breadcrumbs.
 *
 * React Native's networking (fetch/XHR) is implemented via native APIs (NSURLSession on iOS,
 * OkHttp on Android). Both the JS SDK and the native SDK instrument these requests independently,
 * resulting in duplicate breadcrumbs: a JS "xhr" breadcrumb and a native "http" breadcrumb
 * for the same request.
 *
 * Each JS breadcrumb can only consume one native match to avoid false positives
 * when there are legitimate consecutive identical requests.
 */
function deduplicateNativeHttpBreadcrumbs(nativeBreadcrumbs, jsBreadcrumbs) {
    const jsHttpBreadcrumbs = jsBreadcrumbs.filter(b => b.type === 'http' && (b.category === 'xhr' || b.category === 'fetch'));
    if (jsHttpBreadcrumbs.length === 0) {
        return nativeBreadcrumbs;
    }
    const consumedJsIndices = new Set();
    return nativeBreadcrumbs.filter(nativeBreadcrumb => {
        if (nativeBreadcrumb.type !== 'http' || nativeBreadcrumb.category !== 'http') {
            return true;
        }
        const matchIndex = jsHttpBreadcrumbs.findIndex((jsBreadcrumb, index) => {
            var _a, _b, _c, _d, _e, _f;
            if (consumedJsIndices.has(index)) {
                return false;
            }
            const sameMethod = ((_a = nativeBreadcrumb.data) === null || _a === void 0 ? void 0 : _a.method) === ((_b = jsBreadcrumb.data) === null || _b === void 0 ? void 0 : _b.method);
            const sameUrl = ((_c = nativeBreadcrumb.data) === null || _c === void 0 ? void 0 : _c.url) === ((_d = jsBreadcrumb.data) === null || _d === void 0 ? void 0 : _d.url);
            const nativeStatus = (_e = nativeBreadcrumb.data) === null || _e === void 0 ? void 0 : _e.status_code;
            const jsStatus = (_f = jsBreadcrumb.data) === null || _f === void 0 ? void 0 : _f.status_code;
            const sameStatus = nativeStatus == null && jsStatus == null
                ? true
                : nativeStatus != null && jsStatus != null && Number(nativeStatus) === Number(jsStatus);
            const withinTimeTolerance = nativeBreadcrumb.timestamp != null &&
                jsBreadcrumb.timestamp != null &&
                Math.abs(nativeBreadcrumb.timestamp - jsBreadcrumb.timestamp) <=
                    HTTP_BREADCRUMB_DEDUP_TIMESTAMP_TOLERANCE_SECONDS;
            return sameMethod && sameUrl && sameStatus && withinTimeTolerance;
        });
        if (matchIndex !== -1) {
            consumedJsIndices.add(matchIndex);
            return false;
        }
        return true;
    });
}
//# sourceMappingURL=devicecontext.js.map