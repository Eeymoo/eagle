/**
 * PATCHED copy of expo/src/winter/runtime.native.ts (expo 54.0.37).
 *
 * Upstream runs `installFormDataPatch(FormData)` at module top level,
 * referencing the GLOBAL FormData — but RN's FormData polyfill (setUpXHR in
 * InitializeCore) is injected AFTER the expo winter module evaluates, so the
 * bare identifier throws `ReferenceError: Property 'FormData' doesn't exist`
 * and kills the app at startup (expo SDK 54.0.37, no upstream fix released).
 * This copy guards the access; the redirect is wired in metro.config.js.
 *
 * Keep in sync with node_modules/expo/src/winter/runtime.native.ts.
 */
import { installFormDataPatch } from 'expo/src/winter/FormData';
import { installGlobal as install } from 'expo/src/winter/installGlobal';

// https://encoding.spec.whatwg.org/#textdecoder
install('TextDecoder', () => require('expo/src/winter/TextDecoder').TextDecoder);
// https://encoding.spec.whatwg.org/#interface-textdecoderstream
install('TextDecoderStream', () => require('expo/src/winter/TextDecoderStream').TextDecoderStream);
// https://encoding.spec.whatwg.org/#interface-textencoderstream
install('TextEncoderStream', () => require('expo/src/winter/TextDecoderStream').TextEncoderStream);
// https://url.spec.whatwg.org/#url
install('URL', () => require('expo/src/winter/url').URL);
// https://url.spec.whatwg.org/#urlsearchparams
install('URLSearchParams', () => require('expo/src/winter/url').URLSearchParams);
// https://streams.spec.whatwg.org/#rs
// ReadableStream is injected by Metro as a global

install('__ExpoImportMetaRegistry', () => require('expo/src/winter/ImportMetaRegistry').ImportMetaRegistry);

// https://html.spec.whatwg.org/multipage/structured-data.html#structuredclone
install('structuredClone', () => require('@ungap/structured-clone').default);

// PATCH: guard the global access — RN injects FormData after this module runs.
if (typeof FormData !== 'undefined') {
  installFormDataPatch(FormData);
}

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
