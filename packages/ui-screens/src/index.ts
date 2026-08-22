/**
 * Public surface of @eagle/ui-screens — the ONE set of Eagle screens.
 *
 * Rendered by:
 *   - Metro (rn-app): 'react-native' resolves to the real RN; PlayerScreen
 *     resolves to PlayerScreen.native.tsx via platform extensions.
 *   - Vite + react-native-web (desktop-app): 'react-native' is aliased to
 *     RNW; PlayerScreen resolves to PlayerScreen.web.tsx (.web first).
 *
 * ChannelList / Settings / Toast / theme are single-source — UI changes
 * here propagate to both heads automatically.
 */
export { t, screenStyles } from './theme.js';
export { ToastProvider, useToast } from './Toast.js';
export { ChannelListScreen } from './ChannelListScreen.js';
export type { ChannelListScreenProps } from './ChannelListScreen.js';
export { SettingsScreen } from './SettingsScreen.js';
export type { SettingsScreenProps } from './SettingsScreen.js';
// Extensionless on purpose: resolved per-platform (.native.tsx / .web.tsx).
// Consumers must set tsconfig moduleSuffixes accordingly.
export { PlayerScreen } from './PlayerScreen';
export type { PlayerScreenProps } from './PlayerScreen';
// VOD (video-mode) player: seek bar, ±10s skips, duration — for isVod
// channels. Live channels keep PlayerScreen (LIVE semantics, no seek).
export { VodPlayerScreen } from './VodPlayerScreen';
export type { VodPlayerScreenProps } from './VodPlayerScreen';
export { LibraryHomeScreen } from './LibraryHomeScreen.js';
export type { LibraryHomeScreenProps } from './LibraryHomeScreen.js';
export { LibraryBrowseScreen, SeriesScreen } from './LibraryBrowseScreen.js';
export type { LibraryBrowseScreenProps, SeriesScreenProps } from './LibraryBrowseScreen.js';
export { DetailScreen } from './DetailScreen.js';
export type { DetailScreenProps } from './DetailScreen.js';
