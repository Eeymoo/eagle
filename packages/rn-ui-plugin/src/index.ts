/**
 * Public surface of the Eagle RN head — now a thin shell.
 * Screens live once in @eagle/ui-screens (rendered natively by Metro here,
 * and by react-native-web on desktop). This package keeps only the RN
 * composition root (App) and platform bridge (platform).
 */
export { EagleApp, MVP_PLUGINS } from './App.js';
export { ReactNativePort, createSettingsStore, fnv1a } from './platform.js';
export {
  t,
  screenStyles,
  ChannelListScreen,
  SettingsScreen,
  PlayerScreen,
  ToastProvider,
  useToast,
} from '@eagle/ui-screens';
