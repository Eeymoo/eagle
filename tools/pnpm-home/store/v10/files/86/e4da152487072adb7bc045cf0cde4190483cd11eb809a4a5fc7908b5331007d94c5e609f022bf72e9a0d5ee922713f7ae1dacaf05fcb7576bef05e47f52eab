import type { SpanAttributeValue } from '@sentry/core';
import * as React from 'react';
export type TouchEventBoundaryProps = {
    /**
     * The category assigned to the breadcrumb that is logged by the touch event.
     */
    breadcrumbCategory?: string;
    /**
     * The type assigned to the breadcrumb that is logged by the touch event.
     */
    breadcrumbType?: string;
    /**
     * The max number of components to display when logging a touch's component tree.
     */
    maxComponentTreeSize?: number;
    /**
     * Component name(s) to ignore when logging the touch event. This prevents unhelpful logs such as
     * "Touch event within element: View" where you still can't tell which View it occurred in.
     */
    ignoreNames?: Array<string | RegExp>;
    /**
     * Deprecated, use ignoreNames instead
     * @deprecated
     */
    ignoredDisplayNames?: Array<string | RegExp>;
    /**
     * React Node wrapped by TouchEventBoundary.
     */
    children?: React.ReactNode;
    /**
     * Label Name used to identify the touched element.
     */
    labelName?: string;
    /**
     * Custom attributes to add to user interaction spans.
     * Accepts an object with string keys and values that are strings, numbers, booleans, or arrays.
     *
     * @experimental This API is experimental and may change in future releases.
     */
    spanAttributes?: Record<string, SpanAttributeValue>;
    /**
     * Enable rage tap detection. When enabled, rapid consecutive taps on the
     * same element are detected and emitted as `ui.multiClick` breadcrumbs.
     *
     * @default true
     */
    enableRageTapDetection?: boolean;
    /**
     * Number of taps within the time window to trigger a rage tap.
     *
     * @default 3
     */
    rageTapThreshold?: number;
    /**
     * Time window in milliseconds for rage tap detection.
     *
     * @default 1000
     */
    rageTapTimeWindow?: number;
    /**
     * Extract text content from children of touched components as a label fallback.
     * Automatically disabled when Session Replay's `maskAllText` is enabled (the default)
     * to avoid leaking masked content via breadcrumbs. Set `maskAllText: false` in your
     * `mobileReplayIntegration` config to enable text extraction.
     * Per-view `Sentry.Mask` boundaries are also respected.
     * Set to `false` to opt out of text extraction entirely.
     * @default true
     */
    extractTextFromChildren?: boolean;
};
/**
 * Boundary to log breadcrumbs for interaction events.
 */
declare class TouchEventBoundary extends React.Component<TouchEventBoundaryProps> {
    static displayName: string;
    static defaultProps: Partial<TouchEventBoundaryProps>;
    readonly name: string;
    private _rageTapDetector;
    constructor(props: TouchEventBoundaryProps);
    /**
     * Registers the TouchEventBoundary as a Sentry Integration.
     */
    componentDidMount(): void;
    /**
     * Sync rage tap options when props change.
     */
    componentDidUpdate(): void;
    /**
     *
     */
    render(): React.ReactNode;
    /**
     * Logs the touch event given the component tree names and a label.
     */
    private _logTouchEvent;
    /**
     * Checks if the name is supposed to be ignored.
     */
    private _isNameIgnored;
    /**
     * Traverses through the component tree when a touch happens and logs it.
     * @param e
     */
    private _onTouchStart;
    private _isMaskAllTextEnabled;
    private _shouldExtractText;
    /**
     * Pushes the name to the componentTreeNames array if it is not ignored.
     */
    private _pushIfNotIgnored;
}
/**
 * Convenience Higher-Order-Component for TouchEventBoundary
 * @param WrappedComponent any React Component
 * @param boundaryProps TouchEventBoundaryProps
 */
declare const withTouchEventBoundary: (InnerComponent: React.ComponentType<any>, boundaryProps?: TouchEventBoundaryProps) => React.FunctionComponent;
export { TouchEventBoundary, withTouchEventBoundary };
//# sourceMappingURL=touchevents.d.ts.map