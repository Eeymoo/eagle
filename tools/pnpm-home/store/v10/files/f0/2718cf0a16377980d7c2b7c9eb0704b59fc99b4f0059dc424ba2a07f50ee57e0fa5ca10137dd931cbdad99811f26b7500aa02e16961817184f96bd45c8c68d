/**
 * Instrumentation for callback-style native module methods.
 *
 * `wrapTurboModule` can only close a call record on its own for two shapes: a
 * plain sync return, and a thenable return. Bridge methods that report
 * completion through success/failure callbacks return `undefined` — the
 * dominant async shape on the Old Architecture, and still used by some
 * TurboModules — so without this layer they collapse to ~0ms sync calls.
 *
 * See https://github.com/getsentry/sentry-react-native/issues/6542.
 */
import type { TurboModuleCallKind } from './turboModuleTracker';
import { type TurboModuleArch } from './turboModuleAggregator';
/**
 * Cap on callback-style calls awaiting their completion callback. A callback
 * that is never invoked would otherwise pin its state forever, so the oldest
 * entry is closed out without a duration once the cap is reached.
 */
export declare const MAX_PENDING_CALLBACK_CALLS = 1024;
/**
 * A completion callback that fires later than this is treated as not being a
 * completion callback at all (e.g. a long-lived subscription handler on the New
 * Architecture, where no `(failure, success)` convention is enforced). The call
 * is still counted, but with a zero duration, so a multi-minute "duration"
 * can't poison the aggregate or fire a bogus slow-call breadcrumb.
 */
export declare const CALLBACK_MAX_AGE_MS = 60000;
/** Tests only. */
export declare function _resetPendingCallbackCalls(): void;
export interface CallbackCallHandle {
    /** Called once the instrumented method returned without a thenable. */
    markReturned: () => void;
    /**
     * Drops the bookkeeping: later callback invocations become no-ops. Returns
     * `true` if a record was already emitted, so the caller doesn't double-count.
     */
    abandon: () => boolean;
}
/**
 * Records a TurboModule invocation, isolated so a failure inside Sentry only
 * drops the data instead of breaking the user's call.
 */
export declare function safeRecordTurboModuleCall(name: string, method: string, kind: TurboModuleCallKind, durationMs: number, errored: boolean, recordId: number | undefined, arch: TurboModuleArch): void;
/**
 * Wraps the trailing completion callbacks of `args` in place so the call's
 * record is emitted when the callback fires rather than when the method
 * returns. Returns `undefined` when the method isn't callback-shaped, which is
 * the common case — nothing is allocated on that path.
 *
 * Never throws, and neither do the returned handle's methods: this runs outside
 * the caller's `try` and before the real invocation, so a failure here must
 * only drop the attribution data, never block or corrupt the user's call.
 *
 * React Native's bridge fixes the shape: the last argument is the success
 * callback, the second-to-last the failure callback, and a non-function
 * argument may never follow a function one (see `genMethod` in RN's
 * `Libraries/BatchedBridge/NativeModules.js`). `'promise'`-typed methods never
 * receive callbacks and are already covered by the thenable path, so they are
 * skipped outright.
 */
export declare function instrumentTrailingCallbacks(args: unknown[], originalFn: (...a: unknown[]) => unknown, name: string, method: string, startedAtMs: number, recordId: number | undefined, arch: TurboModuleArch): CallbackCallHandle | undefined;
//# sourceMappingURL=turboModuleCallbacks.d.ts.map