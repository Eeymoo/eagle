/**
 * Coordinator for multi-instance `<TimeToInitialDisplay>` / `<TimeToFullDisplay>`
 * components on a single screen (active span).
 */
const TTID = 'ttid';
const TTFD = 'ttfd';
const registries = {
    ttid: new Map(),
    ttfd: new Map(),
};
function getOrCreate(kind, parentSpanId) {
    const map = registries[kind];
    let entry = map.get(parentSpanId);
    if (!entry) {
        entry = {
            checkpoints: new Map(),
            listeners: new Set(),
            aggregateReady: false,
            pendingUpFlip: null,
            sticky: new Set(),
        };
        map.set(parentSpanId, entry);
    }
    return entry;
}
function cancelPendingUpFlip(entry) {
    if (entry.pendingUpFlip !== null) {
        clearTimeout(entry.pendingUpFlip);
        entry.pendingUpFlip = null;
    }
}
function computeAggregate(entry) {
    if (entry.checkpoints.size === 0) {
        return false;
    }
    for (const cp of entry.checkpoints.values()) {
        if (!cp.ready) {
            return false;
        }
    }
    return true;
}
// Recompute the raw aggregate and reconcile it with the cached `aggregateReady`
function reevaluate(entry) {
    const raw = computeAggregate(entry);
    if (raw === entry.aggregateReady) {
        cancelPendingUpFlip(entry);
        return;
    }
    if (!raw) {
        cancelPendingUpFlip(entry);
        entry.aggregateReady = false;
        notifyListeners(entry);
        return;
    }
    if (entry.pendingUpFlip !== null) {
        return;
    }
    // the delay here is set to 0 because in React 18 that
    // will schedule the callback to be run asynchronously after the shortest possible delay
    entry.pendingUpFlip = setTimeout(() => {
        entry.pendingUpFlip = null;
        // Re-check on fire — a peer may have un-readied between schedule and now.
        if (!computeAggregate(entry) || entry.aggregateReady) {
            return;
        }
        entry.aggregateReady = true;
        notifyListeners(entry);
    }, 0);
}
function notifyListeners(entry) {
    for (const listener of entry.listeners) {
        listener();
    }
}
function performCleanup(kind, parentSpanId, entry) {
    const liveCheckpoints = entry.checkpoints.size - entry.sticky.size;
    if (liveCheckpoints === 0 && entry.listeners.size === 0) {
        cancelPendingUpFlip(entry);
        registries[kind].delete(parentSpanId);
    }
}
// A bit of a hack but this is used to detect the premature-fire scenario
// where a not-ready checkpoint unmounts while every other checkpoint is ready:
// deleting it would let the aggregate flip to true and immediately record TTFD/TTID,
// even though the unmounting source never actually became ready.
function isSoleBlocker(entry, checkpointId) {
    if (entry.aggregateReady) {
        return false;
    }
    if (entry.checkpoints.size <= 1) {
        // because removing the only checkpoint leaves the registry empty
        return false;
    }
    const cp = entry.checkpoints.get(checkpointId);
    if (!cp || cp.ready) {
        return false;
    }
    for (const [id, other] of entry.checkpoints) {
        if (id === checkpointId) {
            continue;
        }
        if (!other.ready) {
            return false;
        }
    }
    return true;
}
export function registerCheckpoint(kind, parentSpanId, checkpointId, ready) {
    const entry = getOrCreate(kind, parentSpanId);
    // Any new registration means the screen's component graph is changing.
    // Drop leftover sticky entries from previous unmount cycles -- otherwise
    // a remounted checkpoint would be permanently blocked
    if (entry.sticky.size > 0) {
        for (const id of entry.sticky) {
            entry.checkpoints.delete(id);
        }
        entry.sticky.clear();
    }
    entry.checkpoints.set(checkpointId, { ready });
    reevaluate(entry);
    return () => {
        const e = registries[kind].get(parentSpanId);
        if (!e) {
            return;
        }
        // if the checkpoint is the only blocker then removing it would flip the
        // aggregate to true and fire TTFD/TTID even though the unmounting source never became ready.
        // that's why we use `sticky` here to indicate that it gets cleared when the screen fully unmounts
        if (isSoleBlocker(e, checkpointId)) {
            e.sticky.add(checkpointId);
            performCleanup(kind, parentSpanId, e);
            return;
        }
        if (e.checkpoints.delete(checkpointId)) {
            e.sticky.delete(checkpointId);
            reevaluate(e);
        }
        performCleanup(kind, parentSpanId, e);
    };
}
export function updateCheckpoint(kind, parentSpanId, checkpointId, ready) {
    const entry = registries[kind].get(parentSpanId);
    const cp = entry === null || entry === void 0 ? void 0 : entry.checkpoints.get(checkpointId);
    if (!entry || !cp || cp.ready === ready) {
        return;
    }
    cp.ready = ready;
    reevaluate(entry);
}
// Returns true if at least one checkpoint is registered AND all checkpoints are ready
export function isAllReady(kind, parentSpanId) {
    const entry = registries[kind].get(parentSpanId);
    return !!entry && entry.aggregateReady;
}
// Returns true if there is at least one registered checkpoint on this span
export function hasAnyCheckpoints(kind, parentSpanId) {
    const entry = registries[kind].get(parentSpanId);
    return !!entry && entry.checkpoints.size > 0;
}
// Subscribe to aggregate-ready transitions for a given span
export function subscribe(kind, parentSpanId, listener) {
    const entry = getOrCreate(kind, parentSpanId);
    entry.listeners.add(listener);
    return () => {
        const e = registries[kind].get(parentSpanId);
        if (!e) {
            return;
        }
        e.listeners.delete(listener);
        performCleanup(kind, parentSpanId, e);
    };
}
// Drop coordinator state for `parentSpanId` across both kinds.
// Called by the time-to-display integration once a transaction has been
// processed, since the per-span coordinator state is no longer relevant
// after the native draw timestamps have been read.
export function clearSpan(parentSpanId) {
    for (const kind of [TTID, TTFD]) {
        const entry = registries[kind].get(parentSpanId);
        if (entry) {
            cancelPendingUpFlip(entry);
            registries[kind].delete(parentSpanId);
        }
    }
}
export function _resetTimeToDisplayCoordinator() {
    for (const kind of [TTID, TTFD]) {
        for (const entry of registries[kind].values()) {
            cancelPendingUpFlip(entry);
        }
        registries[kind].clear();
    }
}
//# sourceMappingURL=timeToDisplayCoordinator.js.map