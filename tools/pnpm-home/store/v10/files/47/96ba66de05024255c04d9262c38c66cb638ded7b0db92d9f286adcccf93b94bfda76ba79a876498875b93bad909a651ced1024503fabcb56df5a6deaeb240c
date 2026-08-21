import type { ExpoConfig } from '@expo/config-types';
import type { ConfigPlugin } from 'expo/config-plugins';
type BuildPhase = {
    shellScript: string;
};
export declare const withSentryIOS: ConfigPlugin<{
    sentryProperties: string;
    useNativeInit: boolean | undefined;
    disableAutoUpload: boolean | undefined;
}>;
export declare function modifyExistingXcodeBuildScript(script: BuildPhase, disableAutoUpload?: boolean): void;
export declare function addSentryWithBundledScriptsToBundleShellScript(script: string, disableAutoUpload?: boolean): string;
export declare function addDisableAutoUploadToExistingScript(script: BuildPhase): void;
export declare function removeDisableAutoUploadFromExistingScript(script: BuildPhase): void;
export declare function modifyAppDelegate(config: ExpoConfig): ExpoConfig;
export {};
