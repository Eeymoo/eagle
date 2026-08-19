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
//# sourceMappingURL=source.js.map