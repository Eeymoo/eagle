import SentryCli from '@sentry/cli';
import { debug } from '@sentry/core';
import * as fs from 'fs';
import { stripQueryAndHashFromPath, CodeInjection, containsOnlyImports } from './utils.js';
export { generateModuleMetadataInjectorCode, generateReleaseInjectorCode, replaceBooleanFlagsInCode, stringToUUID } from './utils.js';
export { globFiles } from './glob.js';
export { createSentryBuildPluginManager } from './build-plugin-manager.js';
export { createDebugIdUploadFunction } from './debug-id-upload.js';

let babelAnnotationRuntimePromise;
function loadBabelAnnotationRuntime() {
  if (!babelAnnotationRuntimePromise) {
    babelAnnotationRuntimePromise = Promise.all([import('@babel/core'), import('../babel-plugin/index.js')]).then(
      ([babel, babelPlugin]) => {
        return {
          transformAsync: babel.transformAsync,
          componentNameAnnotatePlugin: babelPlugin.default,
          experimentalComponentNameAnnotatePlugin: babelPlugin.experimentalComponentNameAnnotatePlugin
        };
      }
    );
  }
  return babelAnnotationRuntimePromise;
}
function sentryCliBinaryExists() {
  return fs.existsSync(SentryCli.getPath());
}
const COMMENT_USE_STRICT_REGEX = (
  // Note: CodeQL complains that this regex potentially has n^2 runtime. This likely won't affect realistic files.
  /^(?:\s*|\/\*(?:.|\r|\n)*?\*\/|\/\/.*[\n\r])*(?:"[^"]*";|'[^']*';)?/
);
function isJsFile(fileName) {
  const cleanFileName = stripQueryAndHashFromPath(fileName);
  return [".js", ".mjs", ".cjs"].some((ext) => cleanFileName.endsWith(ext));
}
function shouldSkipCodeInjection(code, facadeModuleId) {
  if (code.trim().length === 0) {
    return true;
  }
  if (facadeModuleId && stripQueryAndHashFromPath(facadeModuleId).endsWith(".html")) {
    return containsOnlyImports(code);
  }
  return false;
}
function createComponentNameAnnotateHooks(ignoredComponents, injectIntoHtml) {
  return {
    async transform(code, id) {
      const idWithoutQueryAndHash = stripQueryAndHashFromPath(id);
      if (idWithoutQueryAndHash.match(/\\node_modules\\|\/node_modules\//)) {
        return null;
      }
      if (![".jsx", ".tsx"].some((ending) => idWithoutQueryAndHash.endsWith(ending))) {
        return null;
      }
      const parserPlugins = [];
      if (idWithoutQueryAndHash.endsWith(".jsx")) {
        parserPlugins.push("jsx");
      } else if (idWithoutQueryAndHash.endsWith(".tsx")) {
        parserPlugins.push("jsx", "typescript");
      }
      const { transformAsync, componentNameAnnotatePlugin, experimentalComponentNameAnnotatePlugin } = await loadBabelAnnotationRuntime();
      const plugin = injectIntoHtml ? experimentalComponentNameAnnotatePlugin : componentNameAnnotatePlugin;
      try {
        const result = await transformAsync(code, {
          plugins: [[plugin, { ignoredComponents }]],
          filename: id,
          parserOpts: {
            sourceType: "module",
            allowAwaitOutsideFunction: true,
            plugins: parserPlugins
          },
          generatorOpts: {
            decoratorsBeforeExport: true
          },
          sourceMaps: true
        });
        return {
          code: result?.code ?? code,
          map: result?.map
        };
      } catch (e) {
        debug.error(`Failed to apply react annotate plugin`, e);
      }
      return { code };
    }
  };
}
function getDebugIdSnippet(debugId) {
  return new CodeInjection(
    `var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="${debugId}",e._sentryDebugIdIdentifier="sentry-dbid-${debugId}");`
  );
}

export { COMMENT_USE_STRICT_REGEX, CodeInjection, createComponentNameAnnotateHooks, getDebugIdSnippet, isJsFile, sentryCliBinaryExists, shouldSkipCodeInjection };
//# sourceMappingURL=index.js.map
