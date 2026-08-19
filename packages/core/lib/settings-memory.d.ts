/** In-memory SettingsStore; UI plugins wrap their own persistence (MMKV / Tauri FS). */
export declare class MemorySettingsStore {
    private map;
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    /** Test helper: bulk seed. */
    seed(entries: Record<string, unknown>): this;
    snapshot(): Record<string, unknown>;
}
//# sourceMappingURL=settings-memory.d.ts.map