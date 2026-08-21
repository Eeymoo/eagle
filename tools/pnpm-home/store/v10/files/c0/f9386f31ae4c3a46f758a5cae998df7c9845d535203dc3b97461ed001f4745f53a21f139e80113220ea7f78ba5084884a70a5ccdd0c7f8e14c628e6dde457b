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
/** Upper-exclusive bucket boundaries in milliseconds, matching the issue. */
export const HISTOGRAM_BUCKETS_MS = [1, 5, 20, 100, 500];
/** Suffixes used when serialising bucket counts (e.g. as span attributes). */
export const HISTOGRAM_BUCKET_LABELS = [
    'lt_1ms',
    'lt_5ms',
    'lt_20ms',
    'lt_100ms',
    'lt_500ms',
    'gte_500ms',
];
const aggregates = new Map();
const ignoredModules = new Set();
let onFirstRecordAfterEmpty;
const observers = new Set();
const startObservers = new Set();
let nextRecordId = 0;
// When `false`, `recordTurboModuleCall` is a no-op. The integration flips
// this off when `enableAggregateStats: false` so wrapped TurboModule calls
// don't accumulate into a map that nothing ever drains.
let recordingEnabled = true;
function makeKey(name, method, kind, arch) {
    return `${name}|${method}|${kind}|${arch}`;
}
function bucketIndexForDuration(durationMs) {
    var _a;
    for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i++) {
        // `i` is bounded by `.length`, so the read is in range — `?? Infinity`
        // is a noop at runtime but satisfies `noUncheckedIndexedAccess`.
        const boundary = (_a = HISTOGRAM_BUCKETS_MS[i]) !== null && _a !== void 0 ? _a : Infinity;
        if (durationMs < boundary) {
            return i;
        }
    }
    return HISTOGRAM_BUCKETS_MS.length;
}
/**
 * Replaces the set of TurboModule names whose calls should NOT be aggregated.
 *
 * Per the issue, users may want to opt-out specific modules (e.g. `RNSentry`
 * itself, to keep the signal clean of SDK overhead). An empty list (default)
 * means every wrapped module is aggregated.
 */
export function setIgnoredTurboModules(names) {
    ignoredModules.clear();
    if (!names) {
        return;
    }
    for (const name of names) {
        ignoredModules.add(name);
    }
}
/**
 * Records a single TurboModule method invocation into the aggregate.
 *
 * Must be O(1): called on every wrapped method invocation, including hot
 * async paths. Negative durations (a clock skew artefact between push/pop)
 * are clamped to zero so they still increment counters but don't poison
 * totals or buckets.
 */
export function recordTurboModuleCall(args) {
    var _a, _b;
    if (ignoredModules.has(args.name)) {
        return;
    }
    const arch = (_a = args.arch) !== null && _a !== void 0 ? _a : 'new';
    const duration = args.durationMs > 0 ? args.durationMs : 0;
    if (recordingEnabled) {
        const wasEmpty = aggregates.size === 0;
        const key = makeKey(args.name, args.method, args.kind, arch);
        let entry = aggregates.get(key);
        if (!entry) {
            entry = {
                name: args.name,
                method: args.method,
                kind: args.kind,
                arch,
                callCount: 0,
                errorCount: 0,
                totalDurationMs: 0,
                maxDurationMs: 0,
                buckets: new Array(HISTOGRAM_BUCKETS_MS.length + 1).fill(0),
            };
            aggregates.set(key, entry);
        }
        entry.callCount += 1;
        if (args.errored) {
            entry.errorCount += 1;
        }
        entry.totalDurationMs += duration;
        if (duration > entry.maxDurationMs) {
            entry.maxDurationMs = duration;
        }
        const bucket = bucketIndexForDuration(duration);
        entry.buckets[bucket] = ((_b = entry.buckets[bucket]) !== null && _b !== void 0 ? _b : 0) + 1;
        if (wasEmpty && onFirstRecordAfterEmpty) {
            try {
                onFirstRecordAfterEmpty();
            }
            catch (_c) {
                // intentionally swallowed
            }
        }
    }
    // Observers fire regardless of `recordingEnabled` so span attribution and
    // slow-call breadcrumbs work even when aggregate stats are opted out.
    if (observers.size > 0) {
        const record = {
            name: args.name,
            method: args.method,
            kind: args.kind,
            arch,
            durationMs: duration,
            errored: args.errored,
            recordId: args.recordId,
        };
        for (const observer of observers) {
            try {
                observer(record);
            }
            catch (_d) {
                // A misbehaving observer must not drop records for others.
            }
        }
    }
}
/**
 * Subscribes to per-record notifications. Fires for records that survive the
 * `setAggregateRecordingEnabled` / `setIgnoredTurboModules` filters — the same
 * set that reaches the aggregate map. Observers run synchronously on the wrap
 * hot path, so must be O(1); thrown errors are swallowed.
 */
export function addTurboModuleRecordObserver(observer) {
    observers.add(observer);
}
export function removeTurboModuleRecordObserver(observer) {
    observers.delete(observer);
}
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
export function notifyTurboModuleCallStart(name, method, kind, arch = 'new') {
    const recordId = nextRecordId++;
    if (ignoredModules.has(name) || startObservers.size === 0) {
        return recordId;
    }
    const event = { recordId, name, method, kind, arch };
    for (const observer of startObservers) {
        try {
            observer(event);
        }
        catch (_a) {
            // A misbehaving observer must not drop the start signal for others.
        }
    }
    return recordId;
}
export function addTurboModuleCallStartObserver(observer) {
    startObservers.add(observer);
}
export function removeTurboModuleCallStartObserver(observer) {
    startObservers.delete(observer);
}
/**
 * Registers a callback fired exactly once when the aggregator transitions
 * from empty to non-empty — i.e. when the first record after a drain (or
 * after init) lands. The integration uses this to lazily schedule a periodic
 * flush only when there's work to do, so idle sessions don't churn timers.
 *
 * Pass `undefined` to unregister.
 */
export function setOnFirstTurboModuleRecord(cb) {
    onFirstRecordAfterEmpty = cb;
}
/**
 * Master switch for the aggregator. When disabled, `recordTurboModuleCall`
 * short-circuits and existing entries are cleared, so wrapped TurboModule
 * calls can't accumulate into a map that nothing ever drains (e.g. when the
 * integration was constructed with `enableAggregateStats: false`).
 *
 * Default: enabled.
 */
export function setAggregateRecordingEnabled(enabled) {
    recordingEnabled = enabled;
    if (!enabled) {
        aggregates.clear();
    }
}
/**
 * Drains and returns the current aggregate, clearing the internal state.
 *
 * The returned array is a shallow copy: callers may freely mutate it (e.g.
 * to slice top-N) without affecting the next interval. `buckets` arrays on
 * each entry are also new instances.
 */
export function drainTurboModuleAggregate() {
    if (aggregates.size === 0) {
        return [];
    }
    const out = [];
    for (const entry of aggregates.values()) {
        out.push({
            name: entry.name,
            method: entry.method,
            kind: entry.kind,
            arch: entry.arch,
            callCount: entry.callCount,
            errorCount: entry.errorCount,
            totalDurationMs: entry.totalDurationMs,
            maxDurationMs: entry.maxDurationMs,
            buckets: entry.buckets.slice(),
        });
    }
    aggregates.clear();
    return out;
}
/**
 * Returns whether the aggregator has anything to flush right now. Useful for
 * the periodic timer to skip a no-op send.
 */
export function hasTurboModuleAggregateData() {
    return aggregates.size > 0;
}
/**
 * Resets the aggregator. Tests only.
 */
export function _resetTurboModuleAggregator() {
    aggregates.clear();
    ignoredModules.clear();
    onFirstRecordAfterEmpty = undefined;
    observers.clear();
    startObservers.clear();
    nextRecordId = 0;
    recordingEnabled = true;
}
//# sourceMappingURL=turboModuleAggregator.js.map