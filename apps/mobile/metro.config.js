/** Monorepo-aware Metro config (pnpm workspaces + workspace TS sources). */
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so packages/*/src changes hot-reload.
config.watchFolders = [workspaceRoot];
// Resolve node_modules both locally and at the workspace root (pnpm layout).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm symlinks point outside projectRoot; Metro needs this enabled.
config.resolver.enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExposesTsExports = true;

// Workspace packages are authored in NodeNext style ("./foo.js" referring to
// foo.ts). Metro doesn't rewrite .js→.ts on its own — bridge it here.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
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
