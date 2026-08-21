/**
 * Coordinator for multi-instance `<TimeToInitialDisplay>` / `<TimeToFullDisplay>`
 * components on a single screen (active span).
 */
type Listener = () => void;
declare const TTID = "ttid";
declare const TTFD = "ttfd";
export type DisplayKind = typeof TTID | typeof TTFD;
export declare function registerCheckpoint(kind: DisplayKind, parentSpanId: string, checkpointId: string, ready: boolean): () => void;
export declare function updateCheckpoint(kind: DisplayKind, parentSpanId: string, checkpointId: string, ready: boolean): void;
export declare function isAllReady(kind: DisplayKind, parentSpanId: string): boolean;
export declare function hasAnyCheckpoints(kind: DisplayKind, parentSpanId: string): boolean;
export declare function subscribe(kind: DisplayKind, parentSpanId: string, listener: Listener): () => void;
export declare function clearSpan(parentSpanId: string): void;
export declare function _resetTimeToDisplayCoordinator(): void;
export {};
//# sourceMappingURL=timeToDisplayCoordinator.d.ts.map
