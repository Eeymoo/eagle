/**
 * @eagle/icons — Eagle's icon plugin (WEB entry).
 *
 * Same icon library as peregrine-tauri-ui (lucide@0.460). On web we re-export lucide-react directly - pure React SVG components with no react-native-svg dependency, so nothing pulls RN flow-syntax sources into the vite/esbuild pipeline. The native entry (index.ts) wraps lucide-react-native instead.
 *
 * Icons are re-exported through a STRUCTURAL type (EagleIcon) so both
 * platform forks expose identical props (size/color/strokeWidth) and
 * consumers typecheck identically everywhere.
 */
import React from 'react';
import {
  Library as raw_Library,
  Play as raw_Play,
  Settings as raw_Settings,
  ChevronLeft as raw_ChevronLeft,
  ChevronRight as raw_ChevronRight,
  Tv as raw_Tv,
  Search as raw_Search,
  X as raw_X,
  RefreshCw as raw_RefreshCw,
  Maximize as raw_Maximize,
  Minimize as raw_Minimize,
  Volume2 as raw_Volume2,
  VolumeX as raw_VolumeX,
  Pause as raw_Pause,
  SkipBack as raw_SkipBack,
  SkipForward as raw_SkipForward,
  Plus as raw_Plus,
  Trash2 as raw_Trash2,
  RotateCcw as raw_RotateCcw,
  RotateCw as raw_RotateCw,
  LayoutGrid as raw_LayoutGrid,
  List as raw_List
} from 'lucide-react';

/** Structural icon props every Eagle icon accepts (fork-safe). */
export interface EagleIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number | string;
}
export type EagleIcon = React.ComponentType<EagleIconProps>;

export const Library = raw_Library as EagleIcon;
export const Play = raw_Play as EagleIcon;
export const Settings = raw_Settings as EagleIcon;
export const ChevronLeft = raw_ChevronLeft as EagleIcon;
export const ChevronRight = raw_ChevronRight as EagleIcon;
export const Tv = raw_Tv as EagleIcon;
export const Search = raw_Search as EagleIcon;
export const X = raw_X as EagleIcon;
export const RefreshCw = raw_RefreshCw as EagleIcon;
export const Maximize = raw_Maximize as EagleIcon;
export const Minimize = raw_Minimize as EagleIcon;
export const Volume2 = raw_Volume2 as EagleIcon;
export const VolumeX = raw_VolumeX as EagleIcon;
export const Pause = raw_Pause as EagleIcon;
export const SkipBack = raw_SkipBack as EagleIcon;
export const SkipForward = raw_SkipForward as EagleIcon;
export const Plus = raw_Plus as EagleIcon;
export const Trash2 = raw_Trash2 as EagleIcon;
export const RotateCcw = raw_RotateCcw as EagleIcon;
export const RotateCw = raw_RotateCw as EagleIcon;
export const LayoutGrid = raw_LayoutGrid as EagleIcon;
export const List = raw_List as EagleIcon;

/** Eagle icon defaults (chrome muted / accent states). */
export const iconTokens = {
  color: '#8b93a1',
  colorActive: '#ffffff',
  colorAccent: '#5b89ff',
  strokeWidth: 1.8,
} as const;
