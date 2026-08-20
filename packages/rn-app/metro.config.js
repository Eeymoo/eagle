/** Monorepo-aware Metro config (pnpm workspaces + workspace TS sources). */
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// CRITICAL: exactly ONE react-native copy must reach the bundle.
// pnpm hoisted mode still places a physical copy under apps/mobile/node_modules
// for direct deps; two RN copies split the ViewConfig registry (RCTText crash).
// Resolution order below deliberately resolves react-native (and its internals)
// from the workspace root only.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExposesTsExports = true;

// Workspace packages are authored in NodeNext style ("./foo.js" referring to
// foo.ts). Metro doesn't rewrite .js→.ts on its own — bridge it here.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // PATCH: expo 54.0.37 winter runtime references global FormData at module
  // top level (before RN injects the polyfill) → startup ReferenceError.
  // Resolve normally, then swap in our guarded copy if it's the winter runtime
  // (imported as './runtime', resolved to runtime.native.ts via platform ext).
  if (
    moduleName === './runtime' &&
    /[/\\]expo[/\\]src[/\\]winter[/\\]/.test(context.originModulePath || '')
  ) {
    const patched = path.join(projectRoot, 'patches/expo-winter-runtime');
    return (defaultResolveRequest ?? context.resolveRequest)(
      { ...context, originModulePath: projectRoot },
      patched,
      platform,
    );
  }
  // Redirect any react-native resolution (including nested RN internals and
  // peer imports from @eagle/rn-ui-plugin) to the single root copy.
  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    const rooted = path.join(workspaceRoot, 'node_modules', moduleName);
    return (defaultResolveRequest ?? context.resolveRequest)(
      { ...context, originModulePath: workspaceRoot },
      rooted,
      platform,
    );
  }
  if (moduleName.endsWith('.js') && !moduleName.endsWith('.config.js')) {
    for (const candidate of [
      moduleName.slice(0, -3) + '.ts',
      moduleName.slice(0, -3) + '.tsx',
    ]) {
      try {
        return (defaultResolveRequest ?? context.resolveRequest)(context, candidate, platform);
      } catch {
        // try next
      }
    }
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
