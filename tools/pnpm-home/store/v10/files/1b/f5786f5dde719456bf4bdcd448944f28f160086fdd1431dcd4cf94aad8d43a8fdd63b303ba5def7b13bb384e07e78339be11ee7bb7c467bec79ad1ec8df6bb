import { debug } from '@sentry/core';
import { isWeb } from '../utils/environment';
import { lazyLoadAutoInjectFeedbackButtonIntegration, lazyLoadAutoInjectFeedbackIntegration, lazyLoadAutoInjectScreenshotButtonIntegration, lazyLoadShakeToReportIntegration, } from './lazy';
import { startShakeListener, stopShakeListener } from './ShakeToReportBug';
export const PULL_DOWN_CLOSE_THRESHOLD = 200;
export const SLIDE_ANIMATION_DURATION = 200;
export const BACKGROUND_ANIMATION_DURATION = 200;
const NOOP_SET_VISIBILITY = () => {
    // No-op
};
class FeedbackManager {
    static get _feedbackComponentName() {
        throw new Error('Subclasses must override feedbackComponentName');
    }
    static initialize(setVisibility) {
        this._setVisibility = setVisibility;
    }
    /**
     * For testing purposes only.
     */
    static reset() {
        this._isVisible = false;
        this._setVisibility = NOOP_SET_VISIBILITY;
    }
    static show() {
        if (this._setVisibility !== NOOP_SET_VISIBILITY) {
            this._isVisible = true;
            this._setVisibility(true);
        }
        else {
            // This message should be always shown otherwise it's not possible to use the widget.
            // oxlint-disable-next-line eslint(no-console)
            console.warn(`[Sentry] ${this._feedbackComponentName} requires 'Sentry.wrap(RootComponent)' to be called before 'show${this._feedbackComponentName}()'.`);
        }
    }
    static hide() {
        if (this._setVisibility !== NOOP_SET_VISIBILITY) {
            this._isVisible = false;
            this._setVisibility(false);
        }
        else {
            // This message should be always shown otherwise it's not possible to use the widget.
            // oxlint-disable-next-line eslint(no-console)
            console.warn(`[Sentry] ${this._feedbackComponentName} requires 'Sentry.wrap(RootComponent)' before interacting with the widget.`);
        }
    }
    static isFormVisible() {
        return this._isVisible;
    }
}
FeedbackManager._isVisible = false;
// Default to NOOP so `show()`/`hide()` don't call `undefined(...)` when
// invoked before `FeedbackFormProvider` mounts and calls `initialize()`.
FeedbackManager._setVisibility = NOOP_SET_VISIBILITY;
/**
 * Provides functionality to show and hide the feedback form.
 */
export class FeedbackFormManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'FeedbackForm';
    }
}
/** @deprecated Use `FeedbackFormManager` instead. */
export const FeedbackWidgetManager = FeedbackFormManager;
/**
 * Provides functionality to show and hide the feedback button.
 */
export class FeedbackButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'FeedbackButton';
    }
}
/**
 * Provides functionality to show and hide the screenshot button.
 */
export class ScreenshotButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'ScreenshotButton';
    }
}
const showFeedbackForm = () => {
    lazyLoadAutoInjectFeedbackIntegration();
    FeedbackFormManager.show();
};
const resetFeedbackFormManager = () => {
    FeedbackFormManager.reset();
};
/** @deprecated Use `showFeedbackForm` instead. */
const showFeedbackWidget = showFeedbackForm;
/** @deprecated Use `resetFeedbackFormManager` instead. */
const resetFeedbackWidgetManager = resetFeedbackFormManager;
/** @deprecated `showFeedbackButton` will be removed in a future major version. */
const showFeedbackButton = () => {
    lazyLoadAutoInjectFeedbackButtonIntegration();
    FeedbackButtonManager.show();
};
/** @deprecated `hideFeedbackButton` will be removed in a future major version. */
const hideFeedbackButton = () => {
    FeedbackButtonManager.hide();
};
const resetFeedbackButtonManager = () => {
    FeedbackButtonManager.reset();
};
const showScreenshotButton = () => {
    if (isWeb()) {
        debug.warn('ScreenshotButton is not supported on Web.');
        return;
    }
    lazyLoadAutoInjectScreenshotButtonIntegration();
    ScreenshotButtonManager.show();
};
const hideScreenshotButton = () => {
    ScreenshotButtonManager.hide();
};
const resetScreenshotButtonManager = () => {
    ScreenshotButtonManager.reset();
};
let _imperativeShakeListenerStarted = false;
const enableFeedbackOnShake = () => {
    lazyLoadAutoInjectFeedbackIntegration();
    lazyLoadShakeToReportIntegration();
    if (!_imperativeShakeListenerStarted) {
        _imperativeShakeListenerStarted = startShakeListener(showFeedbackForm);
    }
};
const disableFeedbackOnShake = () => {
    if (_imperativeShakeListenerStarted) {
        stopShakeListener();
        _imperativeShakeListenerStarted = false;
    }
};
export { showFeedbackButton, hideFeedbackButton, showFeedbackForm, showFeedbackWidget, enableFeedbackOnShake, disableFeedbackOnShake, showScreenshotButton, hideScreenshotButton, resetFeedbackButtonManager, resetFeedbackFormManager, resetFeedbackWidgetManager, resetScreenshotButtonManager, };
//# sourceMappingURL=FeedbackFormManager.js.map