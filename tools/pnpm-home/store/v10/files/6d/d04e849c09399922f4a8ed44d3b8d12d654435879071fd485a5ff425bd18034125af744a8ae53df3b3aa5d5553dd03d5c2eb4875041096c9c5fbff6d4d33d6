import { type TurboModuleArch } from './turboModuleAggregator';
/** Tests only. */
export declare function _resetWrappedModules(): void;
/**
 * Wraps every function-valued property on the given TurboModule so that each
 * invocation is recorded on the Sentry TurboModule tracker. Returns the same
 * `module` reference for chaining convenience.
 *
 * - Sync methods are tracked as `kind: 'sync'` and popped right after the call.
 * - Async methods (those returning a thenable) are relabelled to `kind: 'async'`
 *   right after the call dispatches and popped when the returned promise settles.
 * - Callback-style methods (trailing function arguments, no thenable return —
 *   the dominant async shape on the Old Architecture bridge) have their
 *   completion callbacks wrapped, so the recorded duration spans until the
 *   callback fires instead of collapsing to ~0ms. See
 *   https://github.com/getsentry/sentry-react-native/issues/6542.
 *
 * `skip` can be used to opt specific method names out of tracking (e.g. very
 * hot, no-op methods like RN's `addListener`/`removeListeners` event-emitter
 * stubs which would otherwise pollute the scope).
 */
export declare function wrapTurboModule<T extends object>(name: string, module: T | null | undefined, options?: {
    skip?: ReadonlyArray<string>;
    arch?: TurboModuleArch;
}): T | null | undefined;
//# sourceMappingURL=wrapTurboModule.d.ts.map