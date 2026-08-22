/**
 * @eagle/icons — Eagle's icon plugin (WEB entry).
 *
 * Same icon library as peregrine-tauri-ui (lucide@0.460). On web we
 * re-export lucide-react directly — pure React SVG components with no
 * react-native-svg dependency, so nothing pulls RN flow-syntax sources
 * into the vite/esbuild pipeline. The native entry (index.ts) wraps
 * lucide-react-native instead; both share identical prop names
 * (size/color/strokeWidth) and icon names, so consumers are identical
 * across platforms.
 */
export {
  Library, Play, Settings, ChevronLeft, ChevronRight, Tv, Search, X,
  RefreshCw, Maximize, Minimize, Volume2, VolumeX, Pause, SkipBack,
  SkipForward, Plus, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Eagle icon defaults (chrome muted / accent states). */
export const iconTokens = {
  color: '#8b93a1',
  colorActive: '#ffffff',
  colorAccent: '#5b89ff',
  strokeWidth: 1.8,
} as const;

/** Icon component type (re-exported for consumers' props). */
export type EagleIcon = LucideIcon;
