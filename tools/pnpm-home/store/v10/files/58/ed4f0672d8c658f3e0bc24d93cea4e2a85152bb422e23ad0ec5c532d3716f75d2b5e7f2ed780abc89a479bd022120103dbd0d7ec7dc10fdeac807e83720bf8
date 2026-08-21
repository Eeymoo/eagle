import * as React from 'react';
import { Animated } from 'react-native';
import type { FeedbackFormStyles } from './FeedbackForm.types';
export interface FeedbackFormProviderProps {
    children: React.ReactNode;
    styles?: FeedbackFormStyles;
}
export interface FeedbackFormProviderState {
    isButtonVisible: boolean;
    isScreenshotButtonVisible: boolean;
    isVisible: boolean;
    backgroundOpacity: Animated.Value;
    panY: Animated.Value;
    isScrollAtTop: boolean;
}
/**
 * FeedbackFormProvider is a component that wraps the feedback widget and provides
 * functionality to show and hide the widget. It also manages the visibility of the
 * feedback button and screenshot button.
 */
export declare class FeedbackFormProvider extends React.Component<FeedbackFormProviderProps> {
    state: FeedbackFormProviderState;
    private _themeListener;
    private _startedShakeListener;
    private _panResponder;
    constructor(props: FeedbackFormProviderProps);
    /**
     * Add a listener to the theme change event and start shake detection if configured.
     */
    componentDidMount(): void;
    /**
     * Clean up the theme listener and stop shake detection.
     */
    componentWillUnmount(): void;
    /**
     * Animates the background opacity when the modal is shown.
     */
    componentDidUpdate(_prevProps: any, prevState: FeedbackFormProviderState): void;
    /**
     * Renders the feedback form modal.
     */
    render(): React.ReactNode;
    private _handleScroll;
    private _setVisibilityFunction;
    private _setButtonVisibilityFunction;
    private _setScreenshotButtonVisibilityFunction;
    private _handleClose;
}
//# sourceMappingURL=FeedbackFormProvider.d.ts.map