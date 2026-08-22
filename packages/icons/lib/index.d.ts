/**
 * @eagle/icons — Eagle's icon plugin (NATIVE entry).
 *
 * Same icon library as peregrine-tauri-ui (lucide@0.460). Wraps lucide-react-native behind Eagle defaults; the web entry (index.web.ts) re-exports lucide-react. Both forks share identical prop names and icon names.
 *
 * Icons are re-exported through a STRUCTURAL type (EagleIcon) so both
 * platform forks expose identical props (size/color/strokeWidth) and
 * consumers typecheck identically everywhere.
 */
import React from 'react';
/** Structural icon props every Eagle icon accepts (fork-safe). */
export interface EagleIconProps {
    size?: number;
    color?: string;
    strokeWidth?: number | string;
}
export type EagleIcon = React.ComponentType<EagleIconProps>;
export declare const Library: EagleIcon;
export declare const Play: EagleIcon;
export declare const Settings: EagleIcon;
export declare const ChevronLeft: EagleIcon;
export declare const ChevronRight: EagleIcon;
export declare const Tv: EagleIcon;
export declare const Search: EagleIcon;
export declare const X: EagleIcon;
export declare const RefreshCw: EagleIcon;
export declare const Maximize: EagleIcon;
export declare const Minimize: EagleIcon;
export declare const Volume2: EagleIcon;
export declare const VolumeX: EagleIcon;
export declare const Pause: EagleIcon;
export declare const SkipBack: EagleIcon;
export declare const SkipForward: EagleIcon;
export declare const Plus: EagleIcon;
export declare const Trash2: EagleIcon;
export declare const RotateCcw: EagleIcon;
export declare const RotateCw: EagleIcon;
export declare const LayoutGrid: EagleIcon;
export declare const List: EagleIcon;
/** Eagle icon defaults (chrome muted / accent states). */
export declare const iconTokens: {
    readonly color: "#8b93a1";
    readonly colorActive: "#ffffff";
    readonly colorAccent: "#5b89ff";
    readonly strokeWidth: 1.8;
};
//# sourceMappingURL=index.d.ts.map