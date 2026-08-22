/** Convenience base with default name-filtering search. */
export class LiveSourceBase {
    async searchChannels(query) {
        const q = query.trim().toLowerCase();
        if (!q)
            return [];
        const { channels } = await this.listChannels();
        return channels.filter((c) => c.name.toLowerCase().includes(q));
    }
}
/** Type guard: does this source expose the media-library capability? */
export function implementsLibrary(source) {
    return (typeof source.listLibraries === 'function' &&
        typeof source.listLibraryItems === 'function');
}
//# sourceMappingURL=source.js.map