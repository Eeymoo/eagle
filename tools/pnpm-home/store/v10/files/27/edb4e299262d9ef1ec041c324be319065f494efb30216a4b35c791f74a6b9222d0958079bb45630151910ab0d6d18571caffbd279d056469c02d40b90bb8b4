Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const SentryCli = require('@sentry/cli');
const core = require('@sentry/core');
const fs = require('fs');
const utils = require('./utils.js');
const glob = require('./glob.js');
const buildPluginManager = require('./build-plugin-manager.js');
const debugIdUpload = require('./debug-id-upload.js');

const _interopDefault = e => e && e.__esModule ? e.default : e;

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const SentryCli__default = /*#__PURE__*/_interopDefault(SentryCli);
const fs__namespace = /*#__PURE__*/_interopNamespace(fs);

let babelAnnotationRuntimePromise;
function loadBabelAnnotationRuntime() {
  if (!babelAnnotationRuntimePromise) {
    babelAnnotationRuntimePromise = Promise.all([import('@babel/core'), Promise.resolve().then(() => require('../babel-plugin/index.js'))]).then(
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
  return fs__namespace.existsSync(SentryCli__default.getPath());
}
const COMMENT_USE_STRICT_REGEX = (
  // Note: CodeQL complains that this regex potentially has n^2 runtime. This likely won't affect realistic files.
  /^(?:\s*|\/\*(?:.|\r|\n)*?\*\/|\/\/.*[\n\r])*(?:"[^"]*";|'[^']*';)?/
);
function isJsFile(fileName) {
  const cleanFileName = utils.stripQueryAndHashFromPath(fileName);
  return [".js", ".mjs", ".cjs"].some((ext) => cleanFileName.endsWith(ext));
}
function shouldSkipCodeInjection(code, facadeModuleId) {
  if (code.trim().length === 0) {
    return true;
  }
  if (facadeModuleId && utils.stripQueryAndHashFromPath(facadeModuleId).endsWith(".html")) {
    return utils.containsOnlyImports(code);
  }
  return false;
}
function createComponentNameAnnotateHooks(ignoredComponents, injectIntoHtml) {
  return {
    async transform(code, id) {
      const idWithoutQueryAndHash = utils.stripQueryAndHashFromPath(id);
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
        core.debug.error(`Failed to apply react annotate plugin`, e);
      }
      return { code };
    }
  };
}
function getDebugIdSnippet(debugId) {
  return new utils.CodeInjection(
    `var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="${debugId}",e._sentryDebugIdIdentifier="sentry-dbid-${debugId}");`
  );
}

exports.CodeInjection = utils.CodeInjection;
exports.generateModuleMetadataInjectorCode = utils.generateModuleMetadataInjectorCode;
exports.generateReleaseInjectorCode = utils.generateReleaseInjectorCode;
exports.replaceBooleanFlagsInCode = utils.replaceBooleanFlagsInCode;
exports.stringToUUID = utils.stringToUUID;
exports.globFiles = glob.globFiles;
exports.createSentryBuildPluginManager = buildPluginManager.createSentryBuildPluginManager;
exports.createDebugIdUploadFunction = debugIdUpload.createDebugIdUploadFunction;
exports.COMMENT_USE_STRICT_REGEX = COMMENT_USE_STRICT_REGEX;
exports.createComponentNameAnnotateHooks = createComponentNameAnnotateHooks;
exports.getDebugIdSnippet = getDebugIdSnippet;
exports.isJsFile = isJsFile;
exports.sentryCliBinaryExists = sentryCliBinaryExists;
exports.shouldSkipCodeInjection = shouldSkipCodeInjection;
//# sourceMappingURL=index.js.map
