import type { ErrorBoundaryProps } from '@sentry/react';
import * as React from 'react';
export declare const GLOBAL_ERROR_BOUNDARY_INTEGRATION_NAME = "GlobalErrorBoundary";
/**
 * Props for {@link GlobalErrorBoundary}. Extends the standard `ErrorBoundary`
 * props from `@sentry/react` with two opt-ins that control which
 * non-rendering errors trigger the fallback UI.
 */
export type GlobalErrorBoundaryProps = ErrorBoundaryProps & {
    /**
     * If `true`, the fallback is also rendered for *non-fatal* errors routed
     * through `ErrorUtils` (React Native's global handler).
     *
     * Defaults to `false` — only fatals trigger the fallback, matching the
     * semantics of the native red-screen.
     */
    includeNonFatalGlobalErrors?: boolean;
    /**
     * If `true`, the fallback is also rendered for unhandled promise rejections.
     *
     * Defaults to `false` because many apps prefer to surface rejections as
     * toasts / inline errors rather than as a full-screen fallback.
     */
    includeUnhandledRejections?: boolean;
};
interface GlobalErrorBoundaryState {
    globalError: unknown | null;
    globalEventId: string;
}
/**
 * An error boundary that also catches **non-rendering** fatal JS errors.
 *
 * In addition to the render-phase errors caught by `Sentry.ErrorBoundary`,
 * this component renders the provided fallback when:
 *
 * - A fatal error is reported through React Native's `ErrorUtils` global
 *   handler (event handlers, timers, native → JS bridge errors, …).
 * - Optionally, non-fatal global errors (opt-in via
 *   `includeNonFatalGlobalErrors`).
 * - Optionally, unhandled promise rejections (opt-in via
 *   `includeUnhandledRejections`).
 *
 * The Sentry error pipeline (capture → flush → mechanism tagging) runs in the
 * integration before this component is notified, so the fallback UI surfaces
 * an already-captured event and does not generate a duplicate.
 *
 * Intended usage is at the top of the component tree, typically just inside
 * `Sentry.wrap()`:
 *
 * ```tsx
 * <Sentry.GlobalErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <MyFallback error={error} onRetry={resetError} />
 *   )}
 * >
 *   <App />
 * </Sentry.GlobalErrorBoundary>
 * ```
 */
export declare class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
    state: GlobalErrorBoundaryState;
    private _unsubscribe?;
    private _latched;
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: GlobalErrorBoundaryProps): void;
    render(): React.ReactNode;
    private _subscribe;
    private _onGlobalError;
    private _resetFromFallback;
    private _onRenderBoundaryReset;
}
/**
 * HOC counterpart to {@link GlobalErrorBoundary}.
 */
export declare function withGlobalErrorBoundary<P extends Record<string, unknown>>(WrappedComponent: React.ComponentType<P>, errorBoundaryOptions: GlobalErrorBoundaryProps): React.FC<P>;
export {};
//# sourceMappingURL=GlobalErrorBoundary.d.ts.map
