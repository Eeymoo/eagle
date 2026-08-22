/**
 * @eagle/icons — Eagle's icon plugin.
 *
 * Wraps lucide-react-native (same icon library as peregrine-tauri-ui,
 * lucide@0.460) behind Eagle defaults: shared size/color tokens and a
 * curated export list. Screens import icons from here instead of the
 * raw library — swapping or restyling icons later touches only this
 * package. Icon components accept lucide props (size, color,
 * strokeWidth).
 */
export { Library, Play, Settings, ChevronLeft, ChevronRight, Tv, Search, X, RefreshCw, Maximize, Minimize, Volume2, VolumeX, Pause, SkipBack, SkipForward, Plus, Trash2, } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
/** Eagle icon defaults (chrome muted / accent states). */
export declare const iconTokens: {
    readonly color: "#8b93a1";
    readonly colorActive: "#ffffff";
    readonly colorAccent: "#5b89ff";
    readonly strokeWidth: 1.8;
};
/** Icon component type (re-exported for consumers' props). */
export type EagleIcon = LucideIcon;
//# sourceMappingURL=index.d.ts.map