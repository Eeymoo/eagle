/** In-memory SettingsStore; UI plugins wrap their own persistence (MMKV / Tauri FS). */
export class MemorySettingsStore {
  private map = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
  /** Test helper: bulk seed. */
  seed(entries: Record<string, unknown>): this {
    for (const [k, v] of Object.entries(entries)) this.map.set(k, v);
    return this;
  }
  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.map);
  }
}
