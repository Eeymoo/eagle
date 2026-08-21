type ExpoRouterHref = string | {
    pathname?: string;
    params?: Record<string, unknown>;
};
/**
 * Type definition for Expo Router's router object.
 */
export interface ExpoRouter {
    prefetch?: (href: ExpoRouterHref) => void | Promise<void>;
    push?: (...args: unknown[]) => void;
    replace?: (...args: unknown[]) => void;
    navigate?: (...args: unknown[]) => void;
    back?: () => void;
    dismiss?: (count?: number) => void;
}
/**
 * Wraps Expo Router methods to add automated performance monitoring and breadcrumbs.
 *
 * Currently wraps:
 *  - `prefetch` — wraps the call in a `navigation.prefetch` span.
 *  - `push` / `replace` / `navigate` / `back` / `dismiss` — adds a navigation
 *    breadcrumb, wraps the call in a short-lived span that mirrors prefetch's
 *    error/status handling, and tags the subsequent idle navigation transaction
 *    with the initiating `navigation.method` so the resulting span can be
 *    attributed back to the call site.
 *
 * Safe to call repeatedly — guarded by a single `__sentryWrapped` flag.
 *
 * @param router - The Expo Router instance from `useRouter()` hook
 * @returns The same router instance with instrumented methods
 */
export declare function wrapExpoRouter<T extends ExpoRouter>(router: T): T;
export {};
//# sourceMappingURL=expoRouter.d.ts.map
