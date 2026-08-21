Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const index = require('../core/index.js');
const MagicString = require('magic-string');
const path = require('node:path');
const node_module = require('node:module');
const buildPluginManager = require('../core/build-plugin-manager.js');
const utils = require('../core/utils.js');
const glob = require('../core/glob.js');
const debugIdUpload = require('../core/debug-id-upload.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
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

const MagicString__default = /*#__PURE__*/_interopDefault(MagicString);
const path__namespace = /*#__PURE__*/_interopNamespace(path);

let viteParseAstAsyncPromise;
const JS_MODULE_ID_FILTER = /\.[cm]?[jt]sx?(?:[?#].*)?$/;
function hasExistingDebugID(code) {
  const chunkStartSnippet = code.slice(0, 6e3);
  const chunkEndSnippet = code.slice(-500);
  if (chunkStartSnippet.includes("_sentryDebugIdIdentifier") || chunkEndSnippet.includes("//# debugId=")) {
    return true;
  }
  return false;
}
function getRollupMajorVersion() {
  try {
    const req = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('rollup/index.js', document.baseURI).href)));
    const rollup = req("rollup");
    return rollup.VERSION?.split(".")[0];
  } catch {
  }
  return void 0;
}
function getViteParseAstAsync() {
  if (!viteParseAstAsyncPromise) {
    viteParseAstAsyncPromise = Promise.resolve().then(async () => {
      const viteModule = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('rollup/index.js', document.baseURI).href)))("vite");
      if (typeof viteModule.parseAstAsync !== "function") {
        return null;
      }
      try {
        await viteModule.parseAstAsync("const x = <div />;", { lang: "tsx" });
      } catch {
        return null;
      }
      return viteModule.parseAstAsync;
    }).catch(() => null);
  }
  return viteParseAstAsyncPromise;
}
function _rollupPluginInternal(userOptions = {}, buildTool, buildToolMajorVersion) {
  const sentryBuildPluginManager = buildPluginManager.createSentryBuildPluginManager(userOptions, {
    loggerPrefix: userOptions._metaOptions?.loggerPrefixOverride ?? `[sentry-${buildTool}-plugin]`,
    buildTool,
    buildToolMajorVersion: buildToolMajorVersion || getRollupMajorVersion()
  });
  const {
    logger,
    normalizedOptions: options,
    bundleSizeOptimizationReplacementValues: replacementValues,
    bundleMetadata,
    createDependencyOnBuildArtifacts
  } = sentryBuildPluginManager;
  if (options.disable) {
    return {
      name: "sentry-noop-plugin"
    };
  }
  if (process.cwd().match(/\\node_modules\\|\/node_modules\//)) {
    logger.warn("Running Sentry plugin from within a `node_modules` folder. Some features may not work.");
  }
  const freeGlobalDependencyOnBuildArtifacts = createDependencyOnBuildArtifacts();
  const upload = debugIdUpload.createDebugIdUploadFunction({ sentryBuildPluginManager });
  const sourcemapsEnabled = options.sourcemaps?.disable !== true;
  const staticInjectionCode = new utils.CodeInjection();
  if (!options.release.inject) {
    logger.debug("Release injection disabled via `release.inject` option. Will not inject release.");
  } else if (!options.release.name) {
    logger.debug(
      "No release name provided. Will not inject release. Please set the `release.name` option to identify your release."
    );
  } else {
    staticInjectionCode.append(
      utils.generateReleaseInjectorCode({
        release: options.release.name,
        injectBuildInformation: options._experiments.injectBuildInformation || false
      })
    );
  }
  if (Object.keys(bundleMetadata).length > 0) {
    staticInjectionCode.append(utils.generateModuleMetadataInjectorCode(bundleMetadata));
  }
  const transformAnnotations = options.reactComponentAnnotation?.enabled ? index.createComponentNameAnnotateHooks(
    options.reactComponentAnnotation?.ignoredComponents || [],
    !!options.reactComponentAnnotation?._experimentalInjectIntoHtml
  ) : void 0;
  const transformViteAnnotations = options.reactComponentAnnotation?.enabled && buildTool === "vite" && buildToolMajorVersion === "8" && !options.reactComponentAnnotation?._experimentalInjectIntoHtml ? /* @__PURE__ */ (() => {
    let viteAnnotationHooksPromise;
    return {
      transform(code, id, meta) {
        if (!viteAnnotationHooksPromise) {
          viteAnnotationHooksPromise = Promise.resolve().then(() => require('../core/component-annotation-vite.js')).then(
            ({ createViteComponentNameAnnotateHooks }) => createViteComponentNameAnnotateHooks(
              options.reactComponentAnnotation?.ignoredComponents || [],
              getViteParseAstAsync
            )
          );
        }
        return viteAnnotationHooksPromise.then((hooks) => hooks.transform(code, id, meta));
      }
    };
  })() : void 0;
  const transformReplace = Object.keys(replacementValues).length > 0;
  const shouldTransform = transformAnnotations || transformReplace;
  function buildStart() {
    void sentryBuildPluginManager.telemetry.emitBundlerPluginExecutionSignal().catch(() => {
    });
  }
  async function transform(code, id, meta) {
    let shouldRunBabelAnnotations = true;
    if (transformViteAnnotations?.transform) {
      const result = await transformViteAnnotations.transform(code, id, meta);
      if (result) {
        return result;
      }
      if (result === null) {
        shouldRunBabelAnnotations = false;
      }
    }
    if (shouldRunBabelAnnotations && transformAnnotations?.transform) {
      const result = await transformAnnotations.transform(code, id);
      if (result) {
        return result;
      }
    }
    if (transformReplace) {
      return utils.replaceBooleanFlagsInCode(code, replacementValues);
    }
    return null;
  }
  function renderChunk(code, chunk, _, meta) {
    if (!index.isJsFile(chunk.fileName)) {
      return null;
    }
    if (index.shouldSkipCodeInjection(code, chunk.facadeModuleId)) {
      return null;
    }
    const injectCode = staticInjectionCode.clone();
    if (sourcemapsEnabled && !hasExistingDebugID(code)) {
      const debugId = utils.stringToUUID(code);
      injectCode.append(index.getDebugIdSnippet(debugId));
    }
    if (injectCode.isEmpty()) {
      return null;
    }
    const ms = meta?.magicString || new MagicString__default(code, { filename: chunk.fileName });
    const match = code.match(index.COMMENT_USE_STRICT_REGEX)?.[0];
    if (match) {
      ms.appendLeft(match.length, injectCode.code());
    } else {
      ms.prepend(injectCode.code());
    }
    if (ms?.constructor?.name === "BindingMagicString") {
      return { code: ms };
    }
    return {
      code: ms.toString(),
      map: ms.generateMap({ file: chunk.fileName, hires: "boundary" })
    };
  }
  async function writeBundle(outputOptions, bundle) {
    try {
      await sentryBuildPluginManager.createRelease();
      if (sourcemapsEnabled && options.sourcemaps?.disable !== "disable-upload") {
        if (outputOptions.dir) {
          const outputDir = outputOptions.dir;
          const JS_AND_MAP_PATTERNS = [
            "/**/*.js",
            "/**/*.mjs",
            "/**/*.cjs",
            "/**/*.js.map",
            "/**/*.mjs.map",
            "/**/*.cjs.map"
          ].map((q) => `${q}?(\\?*)?(#*)`);
          const buildArtifacts = await glob.globFiles(JS_AND_MAP_PATTERNS, { root: outputDir });
          await upload(buildArtifacts);
        } else if (outputOptions.file) {
          await upload([outputOptions.file]);
        } else {
          const buildArtifacts = Object.keys(bundle).map((asset) => path__namespace.join(path__namespace.resolve(), asset));
          await upload(buildArtifacts);
        }
      }
    } finally {
      freeGlobalDependencyOnBuildArtifacts();
      await sentryBuildPluginManager.deleteArtifacts();
    }
  }
  const name = `sentry-${buildTool}-plugin`;
  if (shouldTransform) {
    const transformHook = buildTool === "vite" ? {
      filter: { id: JS_MODULE_ID_FILTER },
      handler: transform
    } : transform;
    return {
      name,
      buildStart,
      transform: transformHook,
      renderChunk,
      writeBundle
    };
  }
  return {
    name,
    buildStart,
    renderChunk,
    writeBundle
  };
}
function sentryRollupPlugin(userOptions = {}) {
  return [_rollupPluginInternal(userOptions, "rollup")];
}

exports.sentryCliBinaryExists = index.sentryCliBinaryExists;
exports._rollupPluginInternal = _rollupPluginInternal;
exports.sentryRollupPlugin = sentryRollupPlugin;
//# sourceMappingURL=index.js.map
