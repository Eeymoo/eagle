import type { Span, StartSpanOptions } from '@sentry/core';
import * as React from 'react';
/**
 * Flags of active spans with manual initial display.
 */
export declare const manualInitialDisplaySpans: WeakMap<Span, true>;
export type TimeToDisplayProps = {
    children?: React.ReactNode;
    /** @deprecated Use `ready` instead. `record` will be removed in the next major version. **/
    record?: boolean;
    ready?: boolean;
};
/**
 * Component to measure time to initial display.
 *
 * Usage example:
 *   <TimeToInitialDisplay ready={headerLoaded} />
 *   <TimeToInitialDisplay ready={contentLoaded} />
 */
export declare function TimeToInitialDisplay(props: TimeToDisplayProps): React.ReactElement;
/**
 * Component to measure time to full display.
 *
 * Usage example:
 *   <TimeToFullDisplay ready={feedReady} />
 *   <TimeToFullDisplay ready={sidebarReady} />
 */
export declare function TimeToFullDisplay(props: TimeToDisplayProps): React.ReactElement;
/**
 * Starts a new span for the initial display.
 *
 * Returns current span if already exists in the currently active span.
 *
 * @deprecated Use `<TimeToInitialDisplay record={boolean}/>` component instead.
 */
export declare function startTimeToInitialDisplaySpan(options?: Omit<StartSpanOptions, 'op' | 'name'> & {
    name?: string;
    isAutoInstrumented?: boolean;
}): Span | undefined;
/**
 * Starts a new span for the full display.
 *
 * Returns current span if already exists in the currently active span.
 *
 * @deprecated Use `<TimeToFullDisplay record={boolean}/>` component instead.
 */
export declare function startTimeToFullDisplaySpan(options?: Omit<StartSpanOptions, 'op' | 'name'> & {
    name?: string;
    timeoutMs?: number;
    isAutoInstrumented?: boolean;
}): Span | undefined;
/**
 *
 */
export declare function updateInitialDisplaySpan(frameTimestampSeconds: number, { activeSpan, span, }?: {
    activeSpan?: Span;
    /**
     * Time to initial display span to update.
     */
    span?: Span;
}): void;
/**
 * Reports that the screen is fully displayed.
 *
 * Stores the current timestamp so the Time to Display integration
 * can create the TTFD span (`ui.load.full_display`) during event processing.
 * If called before TTID completes, the integration adjusts the TTFD
 * timestamp to the TTID end (per the cross-SDK spec).
 * Subsequent calls for the same span are ignored.
 *
 * This is the imperative equivalent of the `<TimeToFullDisplay>` component,
 * matching the cross-SDK `Sentry.reportFullyDisplayed()` API.
 */
export declare function reportFullyDisplayed(): void;
export declare function _popImperativeTtfdTimestamp(spanId: string): number | undefined;
export declare function _resetImperativeTtfdTimestamps(): void;
/**
 * Creates a new TimeToFullDisplay component which triggers the full display recording every time the component is focused.
 */
export declare function createTimeToFullDisplay({ useFocusEffect, }: {
    /**
     * `@react-navigation/native` useFocusEffect hook.
     */
    useFocusEffect: (callback: () => void) => void;
}): React.ComponentType<TimeToDisplayProps>;
/**
 * Creates a new TimeToInitialDisplay component which triggers the initial display recording every time the component is focused.
 */
export declare function createTimeToInitialDisplay({ useFocusEffect, }: {
    useFocusEffect: (callback: () => void) => void;
}): React.ComponentType<TimeToDisplayProps>;
//# sourceMappingURL=timetodisplay.d.ts.map