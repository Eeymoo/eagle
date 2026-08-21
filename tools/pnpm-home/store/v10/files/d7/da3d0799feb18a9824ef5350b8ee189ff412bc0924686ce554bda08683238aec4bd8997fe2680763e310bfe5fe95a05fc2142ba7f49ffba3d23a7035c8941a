Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const index = require('../core/index.js');
const path = require('node:path');
const node_url = require('node:url');
const node_module = require('node:module');
const node_crypto = require('node:crypto');
const buildPluginManager = require('../core/build-plugin-manager.js');
const utils = require('../core/utils.js');
const debugIdUpload = require('../core/debug-id-upload.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
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

const path__namespace = /*#__PURE__*/_interopNamespace(path);

const _req = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('webpack/webpack4and5.js', document.baseURI).href)));
let COMPONENT_ANNOTATION_LOADER;
try {
  COMPONENT_ANNOTATION_LOADER = _req.resolve("@sentry/bundler-plugins/webpack-loader");
} catch {
  const dirname = path__namespace.dirname(node_url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('webpack/webpack4and5.js', document.baseURI).href))));
  COMPONENT_ANNOTATION_LOADER = path__namespace.resolve(dirname, "component-annotation-transform.js");
}
function getWebpackMajorVersion() {
  try {
    const req = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('webpack/webpack4and5.js', document.baseURI).href)));
    const webpack = req("webpack");
    const version = webpack?.version ?? webpack?.default?.version;
    const webpackMajorVersion = version?.split(".")[0];
    return webpackMajorVersion;
  } catch {
    return void 0;
  }
}
function sentryWebpackPluginFactory({
  BannerPlugin: UnsafeBannerPlugin,
  DefinePlugin: UnsafeDefinePlugin
} = {}) {
  return function sentryWebpackPlugin(userOptions = {}) {
    const sentryBuildPluginManager = buildPluginManager.createSentryBuildPluginManager(userOptions, {
      loggerPrefix: userOptions._metaOptions?.loggerPrefixOverride ?? "[sentry-webpack-plugin]",
      buildTool: "webpack",
      buildToolMajorVersion: getWebpackMajorVersion()
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
        apply() {
        }
      };
    }
    if (process.cwd().match(/\\node_modules\\|\/node_modules\//)) {
      logger.warn("Running Sentry plugin from within a `node_modules` folder. Some features may not work.");
    }
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
    const transformReplace = Object.keys(replacementValues).length > 0;
    return {
      apply(compiler) {
        void sentryBuildPluginManager.telemetry.emitBundlerPluginExecutionSignal().catch(() => {
        });
        const BannerPlugin = compiler?.webpack?.BannerPlugin || UnsafeBannerPlugin;
        const DefinePlugin = compiler?.webpack?.DefinePlugin || UnsafeDefinePlugin;
        if (!staticInjectionCode.isEmpty() || sourcemapsEnabled) {
          if (!BannerPlugin) {
            logger.warn(
              "BannerPlugin is not available. Skipping code injection. This usually means webpack is not properly configured."
            );
          } else {
            compiler.options.plugins = compiler.options.plugins || [];
            compiler.options.plugins.push(
              new BannerPlugin({
                raw: true,
                include: /\.(js|ts|jsx|tsx|mjs|cjs)(\?[^?]*)?(#[^#]*)?$/,
                banner: (arg) => {
                  const codeToInject = staticInjectionCode.clone();
                  if (sourcemapsEnabled) {
                    const hash = arg?.chunk?.contentHash?.javascript ?? arg?.chunk?.hash;
                    const debugId = hash ? utils.stringToUUID(hash) : node_crypto.randomUUID();
                    codeToInject.append(index.getDebugIdSnippet(debugId));
                  }
                  return codeToInject.code();
                }
              })
            );
          }
        }
        if (transformReplace && DefinePlugin) {
          compiler.options.plugins = compiler.options.plugins || [];
          compiler.options.plugins.push(new DefinePlugin(replacementValues));
        }
        if (transformAnnotations?.transform) {
          compiler.options.module = compiler.options.module || {};
          compiler.options.module.rules = compiler.options.module.rules || [];
          compiler.options.module.rules.unshift({
            test: /\.[jt]sx$/,
            exclude: /node_modules/,
            enforce: "pre",
            use: [
              {
                loader: COMPONENT_ANNOTATION_LOADER,
                options: {
                  transform: transformAnnotations.transform
                }
              }
            ]
          });
        }
        compiler.hooks.afterEmit.tapAsync(
          "sentry-webpack-plugin",
          (compilation, callback) => {
            const freeGlobalDependencyOnBuildArtifacts = createDependencyOnBuildArtifacts();
            const upload = debugIdUpload.createDebugIdUploadFunction({ sentryBuildPluginManager });
            const run = async () => {
              try {
                await sentryBuildPluginManager.createRelease();
                if (sourcemapsEnabled && options.sourcemaps?.disable !== "disable-upload") {
                  const outputPath = compilation.outputOptions.path ?? path__namespace.resolve();
                  const buildArtifacts = Object.keys(compilation.assets).map((asset) => path__namespace.join(outputPath, asset));
                  await upload(buildArtifacts);
                }
              } finally {
                freeGlobalDependencyOnBuildArtifacts();
                await sentryBuildPluginManager.deleteArtifacts();
              }
            };
            run().then(
              () => callback(),
              (err) => callback(err)
            );
          }
        );
        if (userOptions._experiments?.forceExitOnBuildCompletion && compiler.options.mode === "production") {
          compiler.hooks.done.tap("sentry-webpack-plugin", () => {
            setTimeout(() => {
              logger.debug("Exiting process after debug file upload");
              process.exit(0);
            });
          });
        }
      }
    };
  };
}

exports.sentryWebpackPluginFactory = sentryWebpackPluginFactory;
//# sourceMappingURL=webpack4and5.js.map
