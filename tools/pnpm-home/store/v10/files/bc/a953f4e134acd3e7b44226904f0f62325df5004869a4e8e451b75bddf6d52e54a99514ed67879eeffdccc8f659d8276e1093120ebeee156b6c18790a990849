import * as React from 'react';
export declare const NAVIGATION_CONTAINER_INTEGRATION_NAME = "NavigationContainer";
export type FontStyle = {
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
};
/**
 * Mirrors the `Theme` type from `@react-navigation/native`.
 */
export interface NavigationTheme {
    dark: boolean;
    colors: {
        primary: string;
        background: string;
        card: string;
        text: string;
        border: string;
        notification: string;
    };
    fonts: {
        regular: FontStyle;
        medium: FontStyle;
        bold: FontStyle;
        heavy: FontStyle;
    };
}
/**
 * Props accepted by `Sentry.NavigationContainer`.
 *
 * Mirrors the props of `NavigationContainer` from `@react-navigation/native`
 * so that users get autocomplete without requiring a compile-time dependency
 * on the library.
 */
export interface SentryNavigationContainerProps {
    children: React.ReactNode;
    initialState?: {
        index?: number;
        key?: string;
        routeNames?: string[];
        routes: Array<{
            key?: string;
            name: string;
            params?: object;
            state?: object;
        }>;
        stale?: true;
        type?: string;
    };
    onStateChange?: (state: Readonly<Record<string, unknown>> | undefined) => void;
    onReady?: () => void;
    onUnhandledAction?: (action: Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>) => void;
    theme?: NavigationTheme;
    direction?: 'ltr' | 'rtl';
    linking?: {
        enabled?: boolean;
        prefixes: string[];
        filter?: (url: string) => boolean;
        config?: {
            path?: string;
            screens: Record<string, unknown>;
            initialRouteName?: string;
        };
        getInitialURL?: () => string | null | undefined | Promise<string | null | undefined>;
        subscribe?: (listener: (url: string) => void) => undefined | void | (() => void);
        getStateFromPath?: (path: string, options?: object) => object | undefined;
        getPathFromState?: (state: object, options?: object) => string;
        getActionFromState?: (state: object, options?: object) => object | undefined;
    };
    fallback?: React.ReactNode;
    documentTitle?: {
        enabled?: boolean;
        formatter?: (options: Record<string, unknown> | undefined, route: {
            key: string;
            name: string;
            params?: object;
        } | undefined) => string;
    };
    [key: string]: unknown;
}
/**
 * Drop-in replacement for `NavigationContainer` from `@react-navigation/native`
 * that automatically wires up Sentry's `reactNavigationIntegration`.
 *
 * Sentry registers the navigation container before the user-provided `onReady`
 * callback fires, so navigation spans are captured from the first route.
 *
 * If `@react-navigation/native` is not installed, children are rendered directly
 * and `onReady` is not called.
 *
 * @example
 * ```jsx
 * <Sentry.NavigationContainer>
 *   <Stack.Navigator>
 *     ...
 *   </Stack.Navigator>
 * </Sentry.NavigationContainer>
 * ```
 */
export declare const NavigationContainer: React.ForwardRefExoticComponent<Omit<SentryNavigationContainerProps, "ref"> & React.RefAttributes<unknown>>;
//# sourceMappingURL=NavigationContainer.d.ts.map
