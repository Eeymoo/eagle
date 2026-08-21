import type { ExpoConfig } from '@expo/config-types';
import type { ConfigPlugin } from 'expo/config-plugins';
export declare const withSentryAndroid: ConfigPlugin<{
    sentryProperties: string;
    useNativeInit: boolean | undefined;
    disableAutoUpload: boolean | undefined;
}>;
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 */
export declare function modifyAppBuildGradle(buildGradle: string, disableAutoUpload?: boolean): string;
export declare function modifyMainApplication(config: ExpoConfig): ExpoConfig;
