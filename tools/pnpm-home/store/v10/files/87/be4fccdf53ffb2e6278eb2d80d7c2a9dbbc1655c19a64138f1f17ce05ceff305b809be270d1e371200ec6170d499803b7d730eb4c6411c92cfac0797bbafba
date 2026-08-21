export interface WrapNativeModulesOptions {
    skipModules?: ReadonlyArray<string>;
    skipMethodsPerModule?: Readonly<Record<string, ReadonlyArray<string>>>;
}
/**
 * Wraps legacy `NativeModules.*` on Old Architecture so bridge calls feed the same
 * aggregator / attribution / breadcrumb surface as TurboModules. No-op on New
 * Architecture.
 *
 * Modules that React Native exposes lazily stay lazy: rather than reading (and so
 * initialising) every native module during `Sentry.init`, the lazy getter is
 * replaced with one that wraps the module on first access.
 *
 * @returns names of instrumented modules — wrapped immediately when already
 * materialised, otherwise armed to wrap on first access.
 */
export declare function wrapAllNativeModules(options?: WrapNativeModulesOptions): string[];
//# sourceMappingURL=wrapNativeModules.d.ts.map