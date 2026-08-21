var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug, getCurrentScope, getGlobalScope, getIsolationScope } from '@sentry/core';
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'LogEnricher';
export const logEnricherIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setup(client) {
            client.on('afterInit', () => {
                cacheLogContext().then(() => {
                    client.on('beforeCaptureLog', (log) => {
                        processLog(log, client);
                    });
                }, reason => {
                    debug.log(reason);
                });
            });
        },
    };
};
let NativeCache = undefined;
/**
 * Sets a log attribute if the value exists and the attribute key is not already present.
 *
 * @param logAttributes - The log attributes object to modify.
 * @param key - The attribute key to set.
 * @param value - The value to set (only sets if not null/undefined and key not present).
 * @param setEvenIfPresent - Whether to set the attribute if it is present. Defaults to true.
 */
function setLogAttribute(logAttributes, key, value, setEvenIfPresent = true) {
    if (value != null && (!logAttributes[key] || setEvenIfPresent)) {
        logAttributes[key] = value;
    }
}
function cacheLogContext() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const response = yield NATIVE.fetchNativeLogAttributes();
            NativeCache = Object.assign(Object.assign(Object.assign({}, (((_a = response === null || response === void 0 ? void 0 : response.contexts) === null || _a === void 0 ? void 0 : _a.device) && {
                brand: (_b = response.contexts.device) === null || _b === void 0 ? void 0 : _b.brand,
                model: (_c = response.contexts.device) === null || _c === void 0 ? void 0 : _c.model,
                family: (_d = response.contexts.device) === null || _d === void 0 ? void 0 : _d.family,
            })), (((_e = response === null || response === void 0 ? void 0 : response.contexts) === null || _e === void 0 ? void 0 : _e.os) && {
                os: response.contexts.os.name,
                version: response.contexts.os.version,
            })), (((_f = response === null || response === void 0 ? void 0 : response.contexts) === null || _f === void 0 ? void 0 : _f.release) && {
                release: response.contexts.release,
            }));
        }
        catch (e) {
            return Promise.reject(`[LOGS]: Failed to prepare attributes from Native Layer: ${e}`);
        }
        return Promise.resolve();
    });
}
function processLog(log, client) {
    var _a;
    if (NativeCache === undefined) {
        return;
    }
    // Save log.attributes to a new variable
    const logAttributes = (_a = log.attributes) !== null && _a !== void 0 ? _a : {};
    // Apply scope attributes from all active scopes (global, isolation, and current)
    // These are applied first so they can be overridden by more specific attributes
    const scopeAttributes = collectScopeAttributes();
    Object.keys(scopeAttributes).forEach((key) => {
        setLogAttribute(logAttributes, key, scopeAttributes[key], false);
    });
    // Use setLogAttribute with the variable instead of direct assignment
    setLogAttribute(logAttributes, 'device.brand', NativeCache.brand);
    setLogAttribute(logAttributes, 'device.model', NativeCache.model);
    setLogAttribute(logAttributes, 'device.family', NativeCache.family);
    setLogAttribute(logAttributes, 'os.name', NativeCache.os);
    setLogAttribute(logAttributes, 'os.version', NativeCache.version);
    setLogAttribute(logAttributes, 'sentry.release', NativeCache.release);
    const replay = client.getIntegrationByName('MobileReplay');
    setLogAttribute(logAttributes, 'sentry.replay_id', replay === null || replay === void 0 ? void 0 : replay.getReplayId());
    // Set log.attributes to the variable
    log.attributes = logAttributes;
}
/**
 * Extracts primitive attributes from a scope and merges them into the target object.
 * Only string, number, and boolean attribute values are included.
 *
 * @param scope - The scope to extract attributes from
 * @param target - The target object to merge attributes into
 */
function extractScopeAttributes(scope, target) {
    var _a;
    if (scope && typeof scope.getScopeData === 'function') {
        const scopeAttrs = ((_a = scope === null || scope === void 0 ? void 0 : scope.getScopeData) === null || _a === void 0 ? void 0 : _a.call(scope).attributes) || {};
        Object.keys(scopeAttrs).forEach(key => {
            const value = scopeAttrs[key];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                target[key] = value;
            }
        });
    }
}
/**
 * Collects attributes from all active scopes (global, isolation, and current).
 * Only string, number, and boolean attribute values are supported.
 * Attributes are merged in order of precedence: global < isolation < current.
 *
 * @returns A merged object containing all scope attributes.
 */
function collectScopeAttributes() {
    const attributes = {};
    // Collect attributes from all scopes in order of precedence
    extractScopeAttributes(getGlobalScope(), attributes);
    extractScopeAttributes(getIsolationScope(), attributes);
    extractScopeAttributes(getCurrentScope(), attributes);
    return attributes;
}
//# sourceMappingURL=logEnricherIntegration.js.map