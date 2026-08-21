export declare const DEFAULT_RAGE_TAP_THRESHOLD = 3;
export declare const DEFAULT_RAGE_TAP_TIME_WINDOW = 1000;
export interface TouchedComponentInfo {
    name?: string;
    label?: string;
    element?: string;
    file?: string;
}
export interface RageTapDetectorOptions {
    enabled: boolean;
    threshold: number;
    timeWindow: number;
}
/**
 * Detects rage taps (repeated rapid taps on the same target) and emits
 * `ui.multiClick` breadcrumbs when the threshold is hit.
 *
 * Uses the same breadcrumb category and data shape as the web JS SDK's
 * rage click detection so the Sentry replay timeline renders the fire
 * icon and "Rage Click" label automatically.
 */
export declare class RageTapDetector {
    private _recentTaps;
    private _enabled;
    private _threshold;
    private _timeWindow;
    constructor(options?: Partial<RageTapDetectorOptions>);
    /**
     * Update options at runtime (e.g. when React props change).
     */
    updateOptions(options: Partial<RageTapDetectorOptions>): void;
    /**
     * Call after each touch event. If a rage tap is detected, a `ui.multiClick`
     * breadcrumb is emitted automatically.
     */
    check(touchPath: TouchedComponentInfo[], label?: string): void;
    /**
     * Returns the tap count if rage tap is detected, 0 otherwise.
     */
    private _detect;
}
//# sourceMappingURL=ragetap.d.ts.map
