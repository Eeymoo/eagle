/**
 * Public surface of @eagle/tauri-ui-plugin — the web/Tauri pure head over
 * the shared headless layer + design tokens. Mirrors rn-ui-plugin's surface:
 * same three screens, same controllers, different rendering elements
 * (<video> + hls.js instead of react-native-video).
 */
import './tokens.js';
import './styles.css';

export { EagleTauriApp, MVP_PLUGINS } from './App.js';
export { TauriPort, createSettingsStore, fnv1a } from './platform.js';
export { ChannelListScreen } from './ChannelListScreen.js';
export type { ChannelListScreenProps } from './ChannelListScreen.js';
export { SettingsScreen } from './SettingsScreen.js';
export type { SettingsScreenProps } from './SettingsScreen.js';
export { PlayerScreen } from './PlayerScreen.js';
export type { PlayerScreenProps } from './PlayerScreen.js';
