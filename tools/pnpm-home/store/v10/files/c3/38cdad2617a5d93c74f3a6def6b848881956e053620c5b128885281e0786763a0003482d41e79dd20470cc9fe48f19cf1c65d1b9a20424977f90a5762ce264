import { createComponentNameAnnotateHooks, isJsFile, shouldSkipCodeInjection, getDebugIdSnippet, COMMENT_USE_STRICT_REGEX } from '../core/index.js';
export { sentryCliBinaryExists } from '../core/index.js';
import MagicString from 'magic-string';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { createSentryBuildPluginManager } from '../core/build-plugin-manager.js';
import { CodeInjection, generateReleaseInjectorCode, generateModuleMetadataInjectorCode, stringToUUID, replaceBooleanFlagsInCode } from '../core/utils.js';
import { globFiles } from '../core/glob.js';
import { createDebugIdUploadFunction } from '../core/debug-id-upload.js';

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
    const req = createRequire(import.meta.url);
    const rollup = req("rollup");
    return rollup.VERSION?.split(".")[0];
  } catch {
  }
  return void 0;
}
function getViteParseAstAsync() {
  if (!viteParseAstAsyncPromise) {
    viteParseAstAsyncPromise = Promise.resolve().then(async () => {
      const viteModule = createRequire(import.meta.url)("vite");
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
  const sentryBuildPluginManager = createSentryBuildPluginManager(userOptions, {
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
  const upload = createDebugIdUploadFunction({ sentryBuildPluginManager });
  const sourcemapsEnabled = options.sourcemaps?.disable !== true;
  const staticInjectionCode = new CodeInjection();
  if (!options.release.inject) {
    logger.debug("Release injection disabled via `release.inject` option. Will not inject release.");
  } else if (!options.release.name) {
    logger.debug(
      "No release name provided. Will not inject release. Please set the `release.name` option to identify your release."
    );
  } else {
    staticInjectionCode.append(
      generateReleaseInjectorCode({
        release: options.release.name,
        injectBuildInformation: options._experiments.injectBuildInformation || false
      })
    );
  }
  if (Object.keys(bundleMetadata).length > 0) {
    staticInjectionCode.append(generateModuleMetadataInjectorCode(bundleMetadata));
  }
  const transformAnnotations = options.reactComponentAnnotation?.enabled ? createComponentNameAnnotateHooks(
    options.reactComponentAnnotation?.ignoredComponents || [],
    !!options.reactComponentAnnotation?._experimentalInjectIntoHtml
  ) : void 0;
  const transformViteAnnotations = options.reactComponentAnnotation?.enabled && buildTool === "vite" && buildToolMajorVersion === "8" && !options.reactComponentAnnotation?._experimentalInjectIntoHtml ? /* @__PURE__ */ (() => {
    let viteAnnotationHooksPromise;
    return {
      transform(code, id, meta) {
        if (!viteAnnotationHooksPromise) {
          viteAnnotationHooksPromise = import('../core/component-annotation-vite.js').then(
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
      return replaceBooleanFlagsInCode(code, replacementValues);
    }
    return null;
  }
  function renderChunk(code, chunk, _, meta) {
    if (!isJsFile(chunk.fileName)) {
      return null;
    }
    if (shouldSkipCodeInjection(code, chunk.facadeModuleId)) {
      return null;
    }
    const injectCode = staticInjectionCode.clone();
    if (sourcemapsEnabled && !hasExistingDebugID(code)) {
      const debugId = stringToUUID(code);
      injectCode.append(getDebugIdSnippet(debugId));
    }
    if (injectCode.isEmpty()) {
      return null;
    }
    const ms = meta?.magicString || new MagicString(code, { filename: chunk.fileName });
    const match = code.match(COMMENT_USE_STRICT_REGEX)?.[0];
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
          const buildArtifacts = await globFiles(JS_AND_MAP_PATTERNS, { root: outputDir });
          await upload(buildArtifacts);
        } else if (outputOptions.file) {
          await upload([outputOptions.file]);
        } else {
          const buildArtifacts = Object.keys(bundle).map((asset) => path.join(path.resolve(), asset));
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

export { _rollupPluginInternal, sentryRollupPlugin };
//# sourceMappingURL=index.js.map
