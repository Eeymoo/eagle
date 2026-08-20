/**
 * Token entry for the Tauri head — imports the generated CSS custom
 * properties (38 vars, same source as RN's theme object) as a side effect.
 * Design consistency by construction: screens only ever reference
 * var(--eagle-*); hex values never appear in screen code.
 */
import '@eagle/design-tokens/css';
