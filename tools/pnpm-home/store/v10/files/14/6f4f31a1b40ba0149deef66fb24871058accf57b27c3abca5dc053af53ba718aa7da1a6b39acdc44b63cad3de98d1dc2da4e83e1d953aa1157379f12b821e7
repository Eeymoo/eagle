import type { InputConfigT, Middleware } from 'metro-config';
/**
 * Accepts Sentry formatted stack frames and
 * adds source context to the in app frames.
 *
 * Relative filenames are resolved against the first entry in `allowedRoots`.
 * Both the resolved filename and the allowed roots are canonicalized via
 * `fs.realpath`, so a symlink inside an allowed root pointing outside of it
 * cannot escape the containment check.
 */
export declare const createStackFramesContextMiddleware: (allowedRoots: string[]) => Middleware;
/**
 * Creates a middleware that adds source context to the Sentry formatted stack frames.
 */
export declare const createSentryMetroMiddleware: (middleware: Middleware, allowedRoots: string[]) => Middleware;
/**
 * Adds the Sentry middleware to the Metro server config.
 */
export declare const withSentryMiddleware: (config: InputConfigT) => InputConfigT;
//# sourceMappingURL=metroMiddleware.d.ts.map