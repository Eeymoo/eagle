/**
 * Eagle Tauri UI plugin — RESERVED, not implemented in MVP.
 *
 * Extension contract (mirrors rn-ui-plugin, but as a pure head over the
 * shared headless layer + design tokens):
 *
 *   1. platform.ts : TauriPort implements core's Port over tauri-plugin-http;
 *                    SettingsStore over tauri-plugin-store.
 *   2. controllers : reuse @eagle/headless-ui's createEagleControllers(core)
 *                    verbatim — controllers are renderer-agnostic.
 *   3. tokens      : import '@eagle/design-tokens/css' (dist/tokens.css) for
 *                    the exact same 38 CSS custom properties RN consumes
 *                    natively; design consistency by construction.
 *   4. screens     : same three screens; <Video> → HTML5 <video> + hls.js;
 *                    react-navigation-free routing via react-router.
 *
 * Nothing else changes: business logic in @eagle/core, behavior state
 * machines in @eagle/headless-ui, tokens in @eagle/design-tokens.
 */
export const TAURI_PLUGIN_RESERVED = true;
