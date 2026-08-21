import type { Scope } from '@sentry/core';
/** Whether a TurboModule invocation is `sync` (blocking) or `async` (returns a Promise). */
export type TurboModuleCallKind = 'sync' | 'async';
/**
 * Describes a single TurboModule method invocation currently in flight.
 */
export interface TurboModuleCall {
    /** TurboModule name, e.g. `RNSentry`. */
    name: string;
    /** Method name, e.g. `captureEnvelope`. */
    method: string;
    /** Whether the invocation is `sync` (blocking) or `async` (returns a Promise). */
    kind: TurboModuleCallKind;
    /** `Date.now()` at the moment the call started. */
    startedAtMs: number;
    /** Monotonically increasing id, used as the JS-side `call_id` cross-reference. */
    callId: number;
}
/**
 * Returns the active TurboModule call (top of stack), or `undefined` if no
 * TurboModule call is currently being tracked.
 */
export declare function getActiveTurboModuleCall(): TurboModuleCall | undefined;
/**
 * Returns a copy of the current TurboModule call stack, top-most call last.
 * Exposed for tests and diagnostics.
 */
export declare function getTurboModuleCallStack(): TurboModuleCall[];
/**
 * Resets the tracker. Tests only.
 */
export declare function _resetTurboModuleTracker(): void;
/**
 * Records the start of a TurboModule method invocation and mirrors it onto the
 * current Sentry scope so that any crash report captured during the call
 * carries `contexts.turbo_module` + `turbo_module.*` tags.
 *
 * Returns the assigned `callId`, to be passed back into {@link popTurboModuleCall}.
 */
export declare function pushTurboModuleCall(args: {
    name: string;
    method: string;
    kind: 'sync' | 'async';
    scope?: Scope;
}): number;
/**
 * Updates the `kind` of a previously-pushed call (in place) and re-syncs the
 * scope if the call is currently the active one. Used by
 * {@link wrapTurboModule} once it discovers that a method's return value is
 * thenable.
 *
 * Returns `true` if the call was found and relabelled.
 */
export declare function relabelTurboModuleCallKind(callId: number, kind: 'sync' | 'async'): boolean;
/**
 * Records the end of a TurboModule method invocation previously started with
 * {@link pushTurboModuleCall}. Pops the matching frame off the stack and
 * updates the Sentry scope to point at the new top (or clears the context if
 * the stack is now empty).
 *
 * `callId` is the value returned by `pushTurboModuleCall`. If the call cannot
 * be found (e.g. due to a misuse / race), the pop is a no-op.
 */
export declare function popTurboModuleCall(callId: number): void;
//# sourceMappingURL=turboModuleTracker.d.ts.map
