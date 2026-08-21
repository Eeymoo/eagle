/**
 * Extracts the hard crash information from the event exceptions.
 * No exceptions or undefined handled are not hard crashes.
 *
 * Hard crashes are only unhandled error, not user set unhandled mechanisms.
 */
export function isHardCrash(payload) {
    var _a, _b;
    const values = typeof payload !== 'string' && 'exception' in payload && ((_a = payload.exception) === null || _a === void 0 ? void 0 : _a.values) ? payload.exception.values : [];
    for (const exception of values) {
        if (((_b = exception.mechanism) === null || _b === void 0 ? void 0 : _b.handled) === false && exception.mechanism.type === 'onerror') {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=misc.js.map