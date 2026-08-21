/**
 * Per-(module, method, kind) aggregation of TurboModule invocations.
 *
 * The wrap layer in `wrapTurboModule` already measures each call's duration
 * and outcome. Sending one span per call would explode span counts on hot
 * async paths (every `RNSentry.captureEnvelope`, every JSI lookup, …) so
 * instead we keep O(1) per-key counters + a fixed-bucket histogram and flush
 * the aggregate at coarse-grained points (transaction finish, periodic timer).
 *
 * See https://github.com/getsentry/sentry-react-native/issues/6164.
 */
import type { TurboModuleCallKind } from './turboModuleTracker';
/**
 * The React Native architecture the wrapped module lives under.
 *
 * `'new'` — TurboModule (New Architecture). Records come from `wrapTurboModule`
 * against `TurboModuleRegistry`-resolved modules.
 *
 * `'legacy'` — bridge NativeModule (Old Architecture). Records come from the
 * legacy wrapper (`wrapNativeModules`) which mirrors the same instrumentation
 * surface on top of `NativeModules.*`.
 */
export type TurboModuleArch = 'new' | 'legacy';
/** Upper-exclusive bucket boundaries in milliseconds, matching the issue. */
export declare const HISTOGRAM_BUCKETS_MS: readonly number[];
/** Suffixes used when serialising bucket counts (e.g. as span attributes). */
export declare const HISTOGRAM_BUCKET_LABELS: readonly string[];
/**
 * Aggregate counters for a single `(module, method, kind, arch)` tuple.
 */
export interface TurboModuleAggregate {
    /** TurboModule name, e.g. `RNSentry`. */
    name: string;
    /** Method name, e.g. `captureEnvelope`. */
    method: string;
    /** Whether the invocation was `sync` (blocking) or `async` (returns a Promise). */
    kind: TurboModuleCallKind;
    /** Which architecture the module lives under. */
    arch: TurboModuleArch;
    /** Number of calls recorded since the last drain. */
    callCount: number;
    /** Number of calls that threw / rejected since the last drain. */
    errorCount: number;
    /** Sum of call durations in milliseconds since the last drain. */
    totalDurationMs: number;
    /** Largest single-call duration in milliseconds since the last drain. */
    maxDurationMs: number;
    /**
     * Per-bucket call counts, aligned with {@link HISTOGRAM_BUCKETS_MS}. The
     * final entry is the overflow bucket (`>=500ms`).
     */
    buckets: number[];
}
export interface TurboModuleRecord {
    name: string;
    method: string;
    kind: TurboModuleCallKind;
    arch: TurboModuleArch;
    durationMs: number;
    errored: boolean;
    /**
     * Correlator returned by {@link notifyTurboModuleCallStart}. Present when the
     * wrap layer paired the record with a start notification; missing when a
     * caller invokes `recordTurboModuleCall` directly (tests, external hooks).
     */
    recordId?: number;
}
export interface TurboModuleCallStart {
    recordId: number;
    name: string;
    method: string;
    kind: TurboModuleCallKind;
    arch: TurboModuleArch;
}
export type TurboModuleRecordObserver = (record: TurboModuleRecord) => void;
export type TurboModuleCallStartObserver = (start: TurboModuleCallStart) => void;
/**
 * Replaces the set of TurboModule names whose calls should NOT be aggregated.
 *
 * Per the issue, users may want to opt-out specific modules (e.g. `RNSentry`
 * itself, to keep the signal clean of SDK overhead). An empty list (default)
 * means every wrapped module is aggregated.
 */
export declare function setIgnoredTurboModules(names: ReadonlyArray<string> | undefined): void;
/**
 * Records a single TurboModule method invocation into the aggregate.
 *
 * Must be O(1): called on every wrapped method invocation, including hot
 * async paths. Negative durations (a clock skew artefact between push/pop)
 * are clamped to zero so they still increment counters but don't poison
 * totals or buckets.
 */
export declare function recordTurboModuleCall(args: {
    name: string;
    method: string;
    kind: TurboModuleCallKind;
    durationMs: number;
    errored: boolean;
    recordId?: number;
    /** Defaults to `'new'` for backward compatibility with the pre-legacy callers. */
    arch?: TurboModuleArch;
}): void;
/**
 * Subscribes to per-record notifications. Fires for records that survive the
 * `setAggregateRecordingEnabled` / `setIgnoredTurboModules` filters — the same
 * set that reaches the aggregate map. Observers run synchronously on the wrap
 * hot path, so must be O(1); thrown errors are swallowed.
 */
export declare function addTurboModuleRecordObserver(observer: TurboModuleRecordObserver): void;
export declare function removeTurboModuleRecordObserver(observer: TurboModuleRecordObserver): void;
/**
 * Notifies start observers that a TurboModule call is about to run and returns
 * a `recordId` correlator. The paired {@link recordTurboModuleCall} passes the
 * same id back so consumers (e.g. per-span attribution) can associate the
 * settle-time record with state captured at call-start time — matters for
 * async calls that outlive the span they started in.
 *
 * Returns the `recordId` even for ignored modules so the wrap layer never has
 * to branch — the paired record for an ignored module will be filtered out.
 */
export declare function notifyTurboModuleCallStart(name: string, method: string, kind: TurboModuleCallKind, arch?: TurboModuleArch): number;
export declare function addTurboModuleCallStartObserver(observer: TurboModuleCallStartObserver): void;
export declare function removeTurboModuleCallStartObserver(observer: TurboModuleCallStartObserver): void;
/**
 * Registers a callback fired exactly once when the aggregator transitions
 * from empty to non-empty — i.e. when the first record after a drain (or
 * after init) lands. The integration uses this to lazily schedule a periodic
 * flush only when there's work to do, so idle sessions don't churn timers.
 *
 * Pass `undefined` to unregister.
 */
export declare function setOnFirstTurboModuleRecord(cb: (() => void) | undefined): void;
/**
 * Master switch for the aggregator. When disabled, `recordTurboModuleCall`
 * short-circuits and existing entries are cleared, so wrapped TurboModule
 * calls can't accumulate into a map that nothing ever drains (e.g. when the
 * integration was constructed with `enableAggregateStats: false`).
 *
 * Default: enabled.
 */
export declare function setAggregateRecordingEnabled(enabled: boolean): void;
/**
 * Drains and returns the current aggregate, clearing the internal state.
 *
 * The returned array is a shallow copy: callers may freely mutate it (e.g.
 * to slice top-N) without affecting the next interval. `buckets` arrays on
 * each entry are also new instances.
 */
export declare function drainTurboModuleAggregate(): TurboModuleAggregate[];
/**
 * Returns whether the aggregator has anything to flush right now. Useful for
 * the periodic timer to skip a no-op send.
 */
export declare function hasTurboModuleAggregateData(): boolean;
/**
 * Resets the aggregator. Tests only.
 */
export declare function _resetTurboModuleAggregator(): void;
//# sourceMappingURL=turboModuleAggregator.d.ts.map