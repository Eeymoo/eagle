import { debug } from '@sentry/core';
import { notifyTurboModuleCallStart } from './turboModuleAggregator';
import { _resetPendingCallbackCalls, instrumentTrailingCallbacks, safeRecordTurboModuleCall, } from './turboModuleCallbacks';
import { popTurboModuleCall, pushTurboModuleCall, relabelTurboModuleCallKind } from './turboModuleTracker';
/**
 * Modules we've already wrapped. Tracked off-module so that even sealed proxies
 * (which can't accept a marker property) are protected from double-wrapping.
 */
let wrappedModules = new WeakSet();
/** Tests only. */
export function _resetWrappedModules() {
    wrappedModules = new WeakSet();
    _resetPendingCallbackCalls();
}
/**
 * Wraps every function-valued property on the given TurboModule so that each
 * invocation is recorded on the Sentry TurboModule tracker. Returns the same
 * `module` reference for chaining convenience.
 *
 * - Sync methods are tracked as `kind: 'sync'` and popped right after the call.
 * - Async methods (those returning a thenable) are relabelled to `kind: 'async'`
 *   right after the call dispatches and popped when the returned promise settles.
 * - Callback-style methods (trailing function arguments, no thenable return —
 *   the dominant async shape on the Old Architecture bridge) have their
 *   completion callbacks wrapped, so the recorded duration spans until the
 *   callback fires instead of collapsing to ~0ms. See
 *   https://github.com/getsentry/sentry-react-native/issues/6542.
 *
 * `skip` can be used to opt specific method names out of tracking (e.g. very
 * hot, no-op methods like RN's `addListener`/`removeListeners` event-emitter
 * stubs which would otherwise pollute the scope).
 */
export function wrapTurboModule(name, module, options = {}) {
    var _a, _b;
    if (!module) {
        return module;
    }
    if (wrappedModules.has(module)) {
        return module;
    }
    const skip = new Set((_a = options.skip) !== null && _a !== void 0 ? _a : []);
    const arch = (_b = options.arch) !== null && _b !== void 0 ? _b : 'new';
    const methodNames = collectMethodNames(module);
    if (methodNames.length === 0) {
        // Do NOT add to wrappedModules — a later call (e.g. once a JSI HostObject
        // has materialised its methods) should still get a chance to wrap.
        debug.warn(`[TurboModuleTracker] No methods discovered on '${name}' — TurboModule context will not be attached for this module. ` +
            `This usually means the module is a JSI HostObject that only materialises methods on first access.`);
        return module;
    }
    let wrappedAny = false;
    const target = module;
    for (const key of methodNames) {
        if (skip.has(key)) {
            continue;
        }
        // `target[key]` may be a getter (some JSI HostObject proxies expose methods
        // as accessors under the New Architecture). Guard the read so a throwing
        // getter is treated like a non-wrappable property instead of aborting the
        // entire wrap loop.
        let original;
        try {
            original = target[key];
        }
        catch (_c) {
            continue;
        }
        if (typeof original !== 'function') {
            continue;
        }
        const originalFn = original;
        const wrapper = function sentryTurboModuleWrapper(...args) {
            // The instrumentation must never break the user's call — every tracker
            // interaction is isolated so a failure inside Sentry only drops the
            // attribution data, never the real TurboModule invocation.
            //
            // We don't know yet whether `original` is sync or async — start optimistic
            // as sync, relabel to 'async' if the result turns out to be thenable.
            let callId;
            const startedAtMs = Date.now();
            let recordId;
            try {
                callId = pushTurboModuleCall({ name, method: key, kind: 'sync' });
            }
            catch (e) {
                debug.warn(`[TurboModuleTracker] push failed for ${name}.${key}: ${String(e)}`);
            }
            try {
                recordId = notifyTurboModuleCallStart(name, key, 'sync', arch);
            }
            catch (e) {
                debug.warn(`[TurboModuleTracker] notifyStart failed for ${name}.${key}: ${String(e)}`);
            }
            // Must happen before the call: the wrapped callbacks have to be the ones
            // handed to the native side. Mutates `args` in place, leaving arity and
            // argument types untouched. Isolated internally — neither this nor the
            // returned handle's methods can throw into the user's call.
            const callbackCall = instrumentTrailingCallbacks(args, originalFn, name, key, startedAtMs, recordId, arch);
            let result;
            try {
                result = originalFn.apply(this, args);
            }
            catch (e) {
                // A callback that already fired emitted the record itself.
                const alreadyRecorded = (callbackCall === null || callbackCall === void 0 ? void 0 : callbackCall.abandon()) === true;
                safePop(callId, name, key);
                if (!alreadyRecorded) {
                    safeRecordTurboModuleCall(name, key, 'sync', Date.now() - startedAtMs, true, recordId, arch);
                }
                throw e;
            }
            if (isThenable(result)) {
                // A callback that already fired emitted the record itself — the promise
                // handlers must not add a second one for the same invocation.
                const alreadyRecorded = (callbackCall === null || callbackCall === void 0 ? void 0 : callbackCall.abandon()) === true;
                safeRelabel(callId, 'async', name, key);
                return result.then(value => {
                    safePop(callId, name, key);
                    if (!alreadyRecorded) {
                        safeRecordTurboModuleCall(name, key, 'async', Date.now() - startedAtMs, false, recordId, arch);
                    }
                    return value;
                }, err => {
                    safePop(callId, name, key);
                    if (!alreadyRecorded) {
                        safeRecordTurboModuleCall(name, key, 'async', Date.now() - startedAtMs, true, recordId, arch);
                    }
                    throw err;
                });
            }
            if (callbackCall) {
                // The crash-attribution frame is popped synchronously either way: a
                // frame held until a callback that may never fire would risk blaming
                // this module for an unrelated later native crash. Only the timing
                // record is deferred.
                safePop(callId, name, key);
                callbackCall.markReturned();
                return result;
            }
            safePop(callId, name, key);
            safeRecordTurboModuleCall(name, key, 'sync', Date.now() - startedAtMs, false, recordId, arch);
            return result;
        };
        try {
            target[key] = wrapper;
            wrappedAny = true;
        }
        catch (_d) {
            // Sealed / non-writable property — can't intercept this method, but we
            // can still wrap the rest. Skip silently.
        }
    }
    // Only mark as wrapped if we actually installed at least one wrapper.
    // Otherwise a future call (e.g. after the proxy has materialised methods)
    // should be allowed to retry.
    if (wrappedAny) {
        wrappedModules.add(module);
    }
    else {
        // We discovered methods but couldn't intercept any of them — e.g. the
        // module is frozen, or every method is a read-only accessor. Surface this
        // so the silent no-op is debuggable (the issue would otherwise look like
        // "no crash context attached" with no obvious cause).
        debug.warn(`[TurboModuleTracker] '${name}' has methods but none could be wrapped — TurboModule context will not be attached. ` +
            `This usually means the module is frozen or its methods are non-writable accessors.`);
    }
    return module;
}
/**
 * Returns the union of own + prototype-chain method names on `module`,
 * deduplicated and skipping `Object.prototype`. Walking the prototype chain is
 * necessary for JSI HostObject-backed TurboModule proxies under RN's New
 * Architecture, which can expose methods via the proto chain rather than as
 * own enumerable properties.
 */
function collectMethodNames(module) {
    const seen = new Set();
    let current = module;
    while (current && current !== Object.prototype) {
        for (const key of Object.getOwnPropertyNames(current)) {
            if (key === 'constructor') {
                continue;
            }
            seen.add(key);
        }
        current = Object.getPrototypeOf(current);
    }
    return Array.from(seen);
}
function safePop(callId, name, method) {
    if (callId === undefined) {
        return;
    }
    try {
        popTurboModuleCall(callId);
    }
    catch (e) {
        debug.warn(`[TurboModuleTracker] pop failed for ${name}.${method}: ${String(e)}`);
    }
}
function safeRelabel(callId, kind, name, method) {
    if (callId === undefined) {
        return;
    }
    try {
        relabelTurboModuleCallKind(callId, kind);
    }
    catch (e) {
        debug.warn(`[TurboModuleTracker] relabel failed for ${name}.${method}: ${String(e)}`);
    }
}
function isThenable(value) {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
        return false;
    }
    // A user-defined `then` getter could throw — don't let that escape into the
    // wrapper (which would leak the in-flight tracker frame on top of the bug).
    try {
        const then = value.then;
        return typeof then === 'function';
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=wrapTurboModule.js.map