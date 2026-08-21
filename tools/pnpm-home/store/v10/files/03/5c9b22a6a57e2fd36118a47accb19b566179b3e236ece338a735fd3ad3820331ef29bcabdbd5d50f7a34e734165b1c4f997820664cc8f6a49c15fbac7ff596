import { type Integration } from '@sentry/core';
import type { FeedbackFormTheme } from './FeedbackForm.theme';
import type { FeedbackButtonProps, FeedbackFormProps, ScreenshotButtonProps } from './FeedbackForm.types';
export declare const MOBILE_FEEDBACK_INTEGRATION_NAME = "MobileFeedback";
type FeedbackIntegration = Integration & {
    options: Partial<FeedbackFormProps>;
    buttonOptions: Partial<FeedbackButtonProps>;
    screenshotButtonOptions: Partial<ScreenshotButtonProps>;
    colorScheme?: 'system' | 'light' | 'dark';
    themeLight: Partial<FeedbackFormTheme>;
    themeDark: Partial<FeedbackFormTheme>;
    enableShakeToReport: boolean;
};
export declare const feedbackIntegration: (initOptions?: Partial<FeedbackFormProps> & {
    buttonOptions?: FeedbackButtonProps;
    screenshotButtonOptions?: ScreenshotButtonProps;
    colorScheme?: "system" | "light" | "dark";
    themeLight?: Partial<FeedbackFormTheme>;
    themeDark?: Partial<FeedbackFormTheme>;
    /**
     * Enable showing the feedback widget when the user shakes the device.
     *
     * - iOS: Uses UIKit's motion event detection (no permissions required)
     * - Android: Uses the accelerometer sensor (no permissions required)
     *
     * @default false
     */
    enableShakeToReport?: boolean;
}) => FeedbackIntegration;
export declare const getFeedbackOptions: () => Partial<FeedbackFormProps>;
export declare const getFeedbackButtonOptions: () => Partial<FeedbackButtonProps>;
export declare const getScreenshotButtonOptions: () => Partial<ScreenshotButtonProps>;
export declare const getColorScheme: () => "system" | "light" | "dark";
export declare const getFeedbackLightTheme: () => Partial<FeedbackFormTheme>;
export declare const getFeedbackDarkTheme: () => Partial<FeedbackFormTheme>;
export declare const isShakeToReportEnabled: () => boolean;
export {};
//# sourceMappingURL=integration.d.ts.map