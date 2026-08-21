/**
 * EAS Build Hooks for Sentry
 *
 * This module provides utilities for capturing EAS build lifecycle events
 * and sending them to Sentry. It supports the following EAS npm hooks:
 * - eas-build-on-error: Captures build failures
 * - eas-build-on-success: Captures successful builds (optional)
 * - eas-build-on-complete: Captures build completion with metrics
 *
 * @see https://docs.expo.dev/build-reference/npm-hooks/
 */
/**
 * Environment variables provided by EAS Build.
 * @see https://docs.expo.dev/build-reference/variables/
 */
export interface EASBuildEnv {
    EAS_BUILD?: string;
    EAS_BUILD_ID?: string;
    EAS_BUILD_PLATFORM?: string;
    EAS_BUILD_PROFILE?: string;
    EAS_BUILD_PROJECT_ID?: string;
    EAS_BUILD_GIT_COMMIT_HASH?: string;
    EAS_BUILD_RUN_FROM_CI?: string;
    EAS_BUILD_STATUS?: string;
    EAS_BUILD_APP_VERSION?: string;
    EAS_BUILD_APP_BUILD_VERSION?: string;
    EAS_BUILD_USERNAME?: string;
    EAS_BUILD_WORKINGDIR?: string;
}
/** Options for configuring EAS build hook behavior. */
export interface EASBuildHookOptions {
    dsn?: string;
    tags?: Record<string, string>;
    captureSuccessfulBuilds?: boolean;
    errorMessage?: string;
    successMessage?: string;
}
/** Checks if the current environment is an EAS Build. */
export declare function isEASBuild(): boolean;
/** Gets the EAS build environment variables. */
export declare function getEASBuildEnv(): EASBuildEnv;
/** Captures an EAS build error event. Call this from the eas-build-on-error hook. */
export declare function captureEASBuildError(options?: EASBuildHookOptions): Promise<void>;
/** Captures an EAS build success event. Call this from the eas-build-on-success hook. */
export declare function captureEASBuildSuccess(options?: EASBuildHookOptions): Promise<void>;
/** Captures an EAS build completion event with status. Call this from the eas-build-on-complete hook. */
export declare function captureEASBuildComplete(options?: EASBuildHookOptions): Promise<void>;
//# sourceMappingURL=easBuildHooks.d.ts.map