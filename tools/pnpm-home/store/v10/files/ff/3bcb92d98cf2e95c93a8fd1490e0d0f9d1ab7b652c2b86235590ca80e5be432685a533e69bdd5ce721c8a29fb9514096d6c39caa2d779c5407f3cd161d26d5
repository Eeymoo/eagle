export declare const PULL_DOWN_CLOSE_THRESHOLD = 200;
export declare const SLIDE_ANIMATION_DURATION = 200;
export declare const BACKGROUND_ANIMATION_DURATION = 200;
declare abstract class FeedbackManager {
    protected static _isVisible: boolean;
    protected static _setVisibility: (visible: boolean) => void;
    protected static get _feedbackComponentName(): string;
    static initialize(setVisibility: (visible: boolean) => void): void;
    /**
     * For testing purposes only.
     */
    static reset(): void;
    static show(): void;
    static hide(): void;
    static isFormVisible(): boolean;
}
/**
 * Provides functionality to show and hide the feedback form.
 */
export declare class FeedbackFormManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
/** @deprecated Use `FeedbackFormManager` instead. */
export declare const FeedbackWidgetManager: typeof FeedbackFormManager;
/**
 * Provides functionality to show and hide the feedback button.
 */
export declare class FeedbackButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
/**
 * Provides functionality to show and hide the screenshot button.
 */
export declare class ScreenshotButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
declare const showFeedbackForm: () => void;
declare const resetFeedbackFormManager: () => void;
/** @deprecated Use `showFeedbackForm` instead. */
declare const showFeedbackWidget: () => void;
/** @deprecated Use `resetFeedbackFormManager` instead. */
declare const resetFeedbackWidgetManager: () => void;
/** @deprecated `showFeedbackButton` will be removed in a future major version. */
declare const showFeedbackButton: () => void;
/** @deprecated `hideFeedbackButton` will be removed in a future major version. */
declare const hideFeedbackButton: () => void;
declare const resetFeedbackButtonManager: () => void;
declare const showScreenshotButton: () => void;
declare const hideScreenshotButton: () => void;
declare const resetScreenshotButtonManager: () => void;
declare const enableFeedbackOnShake: () => void;
declare const disableFeedbackOnShake: () => void;
export { showFeedbackButton, hideFeedbackButton, showFeedbackForm, showFeedbackWidget, enableFeedbackOnShake, disableFeedbackOnShake, showScreenshotButton, hideScreenshotButton, resetFeedbackButtonManager, resetFeedbackFormManager, resetFeedbackWidgetManager, resetScreenshotButtonManager, };
//# sourceMappingURL=FeedbackFormManager.d.ts.map