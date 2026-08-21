import type { Integration, Measurements, MeasurementUnit } from '@sentry/core';
export interface FramesMeasurements extends Measurements {
    frames_total: {
        value: number;
        unit: MeasurementUnit;
    };
    frames_slow: {
        value: number;
        unit: MeasurementUnit;
    };
    frames_frozen: {
        value: number;
        unit: MeasurementUnit;
    };
}
export declare const createNativeFramesIntegrations: (enable: boolean | undefined) => Integration | undefined;
/**
 * Instrumentation to add native slow/frozen frames measurements onto transactions
 * and frame data (frames.total, frames.slow, frames.frozen) onto all spans.
 */
export declare const nativeFramesIntegration: () => Integration;
//# sourceMappingURL=nativeFrames.d.ts.map
