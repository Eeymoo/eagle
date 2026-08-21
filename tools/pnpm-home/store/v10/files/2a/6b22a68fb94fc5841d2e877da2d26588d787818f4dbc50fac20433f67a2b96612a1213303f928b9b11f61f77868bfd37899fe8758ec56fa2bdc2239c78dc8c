let _cached;
/**
 * @returns NavigationContainer from @react-navigation/native or null if not installed.
 * The result is cached after the first call.
 */
export function getNavigationContainerComponent() {
    var _a;
    if (_cached !== undefined) {
        return _cached;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('@react-navigation/native');
        _cached = (_a = mod === null || mod === void 0 ? void 0 : mod.NavigationContainer) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        _cached = null;
    }
    return _cached;
}
//# sourceMappingURL=reactNavigationImport.js.map