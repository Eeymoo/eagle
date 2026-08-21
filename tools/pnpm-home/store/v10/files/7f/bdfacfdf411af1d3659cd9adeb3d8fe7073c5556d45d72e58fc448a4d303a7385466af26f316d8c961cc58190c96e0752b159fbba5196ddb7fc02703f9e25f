import { addBreadcrumb, debug } from '@sentry/core';
import { getCurrentReactNativeTracingIntegration } from './tracing/reactnativetracing';
export const DEFAULT_RAGE_TAP_THRESHOLD = 3;
export const DEFAULT_RAGE_TAP_TIME_WINDOW = 1000;
/**
 * Detects rage taps (repeated rapid taps on the same target) and emits
 * `ui.multiClick` breadcrumbs when the threshold is hit.
 *
 * Uses the same breadcrumb category and data shape as the web JS SDK's
 * rage click detection so the Sentry replay timeline renders the fire
 * icon and "Rage Click" label automatically.
 */
export class RageTapDetector {
    constructor(options) {
        var _a, _b, _c;
        this._recentTaps = [];
        this._enabled = (_a = options === null || options === void 0 ? void 0 : options.enabled) !== null && _a !== void 0 ? _a : true;
        this._threshold = (_b = options === null || options === void 0 ? void 0 : options.threshold) !== null && _b !== void 0 ? _b : DEFAULT_RAGE_TAP_THRESHOLD;
        this._timeWindow = (_c = options === null || options === void 0 ? void 0 : options.timeWindow) !== null && _c !== void 0 ? _c : DEFAULT_RAGE_TAP_TIME_WINDOW;
    }
    /**
     * Update options at runtime (e.g. when React props change).
     */
    updateOptions(options) {
        if (options.enabled !== undefined) {
            this._enabled = options.enabled;
            if (!this._enabled) {
                this._recentTaps = [];
            }
        }
        if (options.threshold !== undefined) {
            this._threshold = options.threshold;
        }
        if (options.timeWindow !== undefined) {
            this._timeWindow = options.timeWindow;
        }
    }
    /**
     * Call after each touch event. If a rage tap is detected, a `ui.multiClick`
     * breadcrumb is emitted automatically.
     */
    check(touchPath, label) {
        if (!this._enabled) {
            return;
        }
        const root = touchPath[0];
        if (!root) {
            return;
        }
        const identity = getTapIdentity(root, label);
        const now = Date.now();
        const tapCount = this._detect(identity, now);
        if (tapCount > 0) {
            const message = buildTouchMessage(root, label);
            const node = buildNodeFromTouchPath(root, label);
            addBreadcrumb({
                category: 'ui.multiClick',
                type: 'default',
                message,
                data: {
                    clickCount: tapCount,
                    metric: true,
                    route: getCurrentRoute(),
                    node,
                    path: touchPath,
                },
            });
            debug.log(`[TouchEvents] Rage tap detected: ${tapCount} taps on ${message}`);
        }
    }
    /**
     * Returns the tap count if rage tap is detected, 0 otherwise.
     */
    _detect(identity, now) {
        // If the target changed, reset the buffer — only truly consecutive
        // taps on the same target count. This prevents false positives where
        // time-window pruning removes interleaved taps on other targets.
        const lastTap = this._recentTaps[this._recentTaps.length - 1];
        if (lastTap && lastTap.identity !== identity) {
            this._recentTaps = [];
        }
        this._recentTaps.push({ identity, timestamp: now });
        // Prune taps outside the time window
        const cutoff = now - this._timeWindow;
        this._recentTaps = this._recentTaps.filter(tap => tap.timestamp >= cutoff);
        if (this._recentTaps.length >= this._threshold) {
            const count = this._recentTaps.length;
            this._recentTaps = [];
            return count;
        }
        return 0;
    }
}
function getTapIdentity(root, label) {
    var _a, _b;
    const base = `name:${(_a = root.name) !== null && _a !== void 0 ? _a : ''}|file:${(_b = root.file) !== null && _b !== void 0 ? _b : ''}`;
    if (label) {
        return `label:${label}|${base}`;
    }
    return base;
}
/**
 * Build a human-readable message matching the touch breadcrumb format.
 */
function buildTouchMessage(root, label) {
    if (label) {
        return label;
    }
    return `${root.name}${root.file ? ` (${root.file})` : ''}`;
}
/**
 * Build a node object compatible with the web SDK's `ReplayBaseDomFrameData`
 * so that `stringifyNodeAttributes` in the Sentry frontend can render it.
 *
 * Maps the React Native component info to the DOM-like shape:
 * - `tagName` → element type (e.g. "RCTView") or component name
 * - `attributes['data-sentry-component']` → component name from babel plugin
 * - `attributes['data-sentry-source-file']` → source file
 */
function buildNodeFromTouchPath(root, label) {
    var _a, _b;
    const attributes = {};
    if (root.name) {
        attributes['data-sentry-component'] = root.name;
    }
    if (root.file) {
        attributes['data-sentry-source-file'] = root.file;
    }
    if (label) {
        attributes['sentry-label'] = label;
    }
    return {
        // Mobile replays don't have rrweb node IDs — 0 is a placeholder
        // to satisfy the ReplayBaseDomFrameData shape expected by the frontend.
        id: 0,
        tagName: (_b = (_a = root.element) !== null && _a !== void 0 ? _a : root.name) !== null && _b !== void 0 ? _b : 'unknown',
        textContent: '',
        attributes,
    };
}
function getCurrentRoute() {
    var _a;
    try {
        return (_a = getCurrentReactNativeTracingIntegration()) === null || _a === void 0 ? void 0 : _a.state.currentRoute;
    }
    catch (_b) {
        return undefined;
    }
}
//# sourceMappingURL=ragetap.js.map