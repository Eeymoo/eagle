/** In-memory SettingsStore; UI plugins wrap their own persistence (MMKV / Tauri FS). */
export class MemorySettingsStore {
    map = new Map();
    async get(key) {
        return this.map.get(key);
    }
    async set(key, value) {
        this.map.set(key, value);
    }
    async remove(key) {
        this.map.delete(key);
    }
    /** Test helper: bulk seed. */
    seed(entries) {
        for (const [k, v] of Object.entries(entries))
            this.map.set(k, v);
        return this;
    }
    snapshot() {
        return Object.fromEntries(this.map);
    }
}
//# sourceMappingURL=settings-memory.js.map