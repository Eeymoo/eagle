import { debug } from '@sentry/core';
import { NativeModules } from 'react-native';
import { isTurboModuleEnabled } from '../utils/environment';
import { RN_GLOBAL_OBJ } from '../utils/worldwide';
import { wrapTurboModule } from './wrapTurboModule';
/**
 * Never auto-wrapped:
 * - `RNSentry` is wrapped explicitly by the integration with a curated skip list —
 *   re-wrapping here would double-record and recurse via scope-sync.
 * - The others sit on the hottest paths in the app: `Timing` backs every
 *   `setTimeout`/`setInterval`, `UIManager` every view operation, and the animated
 *   modules run per frame. Instrumenting them would cost more than the signal is
 *   worth and would dominate the aggregate. Instrument them deliberately with
 *   `turboModuleContextIntegration({ modules: [...] })` if you need them.
 */
const IMPLICIT_MODULE_SKIP = new Set([
    'RNSentry',
    'Timing',
    'UIManager',
    'NativeAnimatedModule',
    'NativeAnimatedTurboModule',
]);
/**
 * Wraps legacy `NativeModules.*` on Old Architecture so bridge calls feed the same
 * aggregator / attribution / breadcrumb surface as TurboModules. No-op on New
 * Architecture.
 *
 * Modules that React Native exposes lazily stay lazy: rather than reading (and so
 * initialising) every native module during `Sentry.init`, the lazy getter is
 * replaced with one that wraps the module on first access.
 *
 * @returns names of instrumented modules — wrapped immediately when already
 * materialised, otherwise armed to wrap on first access.
 */
export function wrapAllNativeModules(options = {}) {
    var _a, _b;
    if (isTurboModuleEnabled()) {
        return [];
    }
    const skipModules = new Set(IMPLICIT_MODULE_SKIP);
    for (const name of (_a = options.skipModules) !== null && _a !== void 0 ? _a : []) {
        skipModules.add(name);
    }
    const skipMethodsPerModule = (_b = options.skipMethodsPerModule) !== null && _b !== void 0 ? _b : {};
    let moduleNames;
    try {
        moduleNames = Object.keys(NativeModules);
    }
    catch (e) {
        debug.warn(`[TurboModuleTracker] Failed to enumerate NativeModules for legacy wrapping: ${String(e)}`);
        return [];
    }
    if (moduleNames.length === 0) {
        warnNotEnumerable();
        return [];
    }
    const instrumented = [];
    for (const name of moduleNames) {
        if (skipModules.has(name)) {
            continue;
        }
        if (instrumentModule(name, { skip: skipMethodsPerModule[name], arch: 'legacy' })) {
            instrumented.push(name);
        }
    }
    return instrumented;
}
/**
 * Instruments a single `NativeModules` entry, preserving React Native's lazy
 * module initialisation when the entry is still an unresolved accessor.
 */
function instrumentModule(name, wrapOptions) {
    let descriptor;
    try {
        descriptor = Object.getOwnPropertyDescriptor(NativeModules, name);
    }
    catch (_a) {
        return false;
    }
    if (descriptor && typeof descriptor.get === 'function') {
        return armLazyModule(name, descriptor, wrapOptions);
    }
    let mod = descriptor === null || descriptor === void 0 ? void 0 : descriptor.value;
    if (!descriptor) {
        // Inherited or otherwise exotic property — fall back to a direct read.
        try {
            mod = NativeModules[name];
        }
        catch (_b) {
            return false;
        }
    }
    return wrapResolvedModule(name, mod, wrapOptions);
}
/**
 * Replaces a lazy `NativeModules` accessor with one that resolves through the
 * original getter and wraps the materialised module, so instrumentation costs
 * nothing until the app actually uses the module.
 */
function armLazyModule(name, descriptor, wrapOptions) {
    // Invoked below via `.call(NativeModules)`, never as a bare method reference.
    // oxlint-disable-next-line typescript-eslint(unbound-method)
    const originalGet = descriptor.get;
    if (!originalGet) {
        return false;
    }
    const enumerable = descriptor.enumerable !== false;
    const wrappingGetter = function sentryLazyNativeModuleGetter() {
        const mod = originalGet.call(NativeModules);
        wrapResolvedModule(name, mod, wrapOptions);
        // React Native's own lazy getter replaces the property with a plain value on
        // first read. If that didn't happen, cache it ourselves so later reads don't
        // keep paying for this accessor.
        if (getOwnGetter(name) === wrappingGetter) {
            defineValue(name, mod, enumerable);
        }
        return mod;
    };
    try {
        Object.defineProperty(NativeModules, name, {
            configurable: true,
            enumerable,
            get: wrappingGetter,
            // Mirror RN's lazy-property semantics: assigning replaces the accessor.
            set: (next) => defineValue(name, next, enumerable),
        });
        return true;
    }
    catch (_a) {
        // Non-configurable or frozen — leave RN's property untouched rather than
        // forcing the module to initialise just so we can instrument it.
        return false;
    }
}
function wrapResolvedModule(name, mod, wrapOptions) {
    if (!mod || typeof mod !== 'object') {
        return false;
    }
    wrapTurboModule(name, mod, wrapOptions);
    return true;
}
function getOwnGetter(name) {
    var _a;
    try {
        // Compared by identity only, never invoked from this reference.
        // oxlint-disable-next-line typescript-eslint(unbound-method)
        return (_a = Object.getOwnPropertyDescriptor(NativeModules, name)) === null || _a === void 0 ? void 0 : _a.get;
    }
    catch (_b) {
        return undefined;
    }
}
function defineValue(name, value, enumerable) {
    try {
        Object.defineProperty(NativeModules, name, {
            configurable: true,
            enumerable,
            writable: true,
            value,
        });
    }
    catch (_a) {
        // Keep the accessor in place — worst case we re-enter the getter, which is
        // idempotent because `wrapTurboModule` de-duplicates via a WeakSet.
    }
}
function warnNotEnumerable() {
    const viaHostObject = RN_GLOBAL_OBJ.nativeModuleProxy != null && RN_GLOBAL_OBJ.nativeModuleProxy === NativeModules;
    const reason = viaHostObject
        ? 'because `NativeModules` is a JSI host-object proxy, which cannot be enumerated.'
        : 'because `NativeModules` exposed no enumerable entries.';
    const hint = 'Pass the modules you care about to turboModuleContextIntegration({ modules: [{ name, module }] }) instead.';
    debug.warn(`[TurboModuleTracker] Legacy NativeModules auto-wrap found no modules to instrument ${reason} ${hint}`);
}
//# sourceMappingURL=wrapNativeModules.js.map