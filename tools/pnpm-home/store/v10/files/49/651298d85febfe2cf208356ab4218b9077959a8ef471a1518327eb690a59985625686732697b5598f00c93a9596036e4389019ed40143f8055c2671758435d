import type { Client, TransactionEvent } from '@sentry/core';
export declare const TURBO_MODULES_AGGREGATE_OP = "turbo_modules.aggregate";
export declare const TURBO_MODULES_AGGREGATE_ORIGIN = "auto.tracing.turbo_modules";
/**
 * Drains the aggregate into the transaction event as a synthetic child span
 * plus headline measurements. Runs before `beforeSendTransaction`, so a
 * user-dropped transaction loses its interval — bounded and self-healing.
 */
export declare function attachAggregateToTransactionEvent(event: TransactionEvent): void;
/** Custom Sentry event so long-running sessions without a transaction still emit a signal. */
export declare function flushPeriodicAggregate(client: Client): void;
export declare function roundMs(value: number): number;
//# sourceMappingURL=turboModuleContextFlush.d.ts.map
