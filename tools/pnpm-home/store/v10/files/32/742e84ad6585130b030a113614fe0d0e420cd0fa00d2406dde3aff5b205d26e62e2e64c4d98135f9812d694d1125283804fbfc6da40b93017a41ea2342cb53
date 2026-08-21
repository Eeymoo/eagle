import fs__default from 'fs';
import path__default from 'path';
import * as url from 'url';
import * as util from 'util';
import { promisify } from 'util';
import { stripQueryAndHashFromPath } from './utils.js';

function createDebugIdUploadFunction({ sentryBuildPluginManager }) {
  return async (buildArtifactPaths) => {
    const cleanedPaths = buildArtifactPaths.map(stripQueryAndHashFromPath);
    await sentryBuildPluginManager.uploadSourcemaps(cleanedPaths);
  };
}
async function prepareBundleForDebugIdUpload(bundleFilePath, uploadFolder, chunkIndex, logger, rewriteSourcesHook, resolveSourceMapHook) {
  let bundleContent;
  try {
    bundleContent = await promisify(fs__default.readFile)(bundleFilePath, "utf8");
  } catch (e) {
    logger.error(`Could not read bundle to determine debug ID and source map: ${bundleFilePath}`, e);
    return;
  }
  const debugId = determineDebugIdFromBundleSource(bundleContent);
  if (debugId === void 0) {
    logger.debug(
      `Could not determine debug ID from bundle. This can happen if you did not clean your output folder before installing the Sentry plugin. File will not be source mapped: ${bundleFilePath}`
    );
    return;
  }
  const uniqueUploadName = `${debugId}-${chunkIndex}`;
  bundleContent = addDebugIdToBundleSource(bundleContent, debugId);
  const writeSourceFilePromise = fs__default.promises.writeFile(
    path__default.join(uploadFolder, `${uniqueUploadName}.js`),
    bundleContent,
    "utf-8"
  );
  const writeSourceMapFilePromise = determineSourceMapPathFromBundle(
    bundleFilePath,
    bundleContent,
    logger,
    resolveSourceMapHook
  ).then(async (sourceMapPath) => {
    if (sourceMapPath) {
      await prepareSourceMapForDebugIdUpload(
        sourceMapPath,
        path__default.join(uploadFolder, `${uniqueUploadName}.js.map`),
        debugId,
        rewriteSourcesHook,
        logger
      );
    }
  });
  await writeSourceFilePromise;
  await writeSourceMapFilePromise;
}
function determineDebugIdFromBundleSource(code) {
  const match = code.match(
    /sentry-dbid-([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/
  );
  if (match) {
    return match[1];
  } else {
    return void 0;
  }
}
const SPEC_LAST_DEBUG_ID_REGEX = /\/\/# debugId=([a-fA-F0-9-]+)(?![\s\S]*\/\/# debugId=)/m;
function hasSpecCompliantDebugId(bundleSource) {
  return SPEC_LAST_DEBUG_ID_REGEX.test(bundleSource);
}
function addDebugIdToBundleSource(bundleSource, debugId) {
  if (hasSpecCompliantDebugId(bundleSource)) {
    return bundleSource.replace(SPEC_LAST_DEBUG_ID_REGEX, `//# debugId=${debugId}`);
  } else {
    return `${bundleSource}
//# debugId=${debugId}`;
  }
}
async function determineSourceMapPathFromBundle(bundlePath, bundleSource, logger, resolveSourceMapHook) {
  const sourceMappingUrlMatch = bundleSource.match(/^\s*\/\/# sourceMappingURL=(.*)$/m);
  const sourceMappingUrl = sourceMappingUrlMatch ? sourceMappingUrlMatch[1] : void 0;
  const searchLocations = [];
  if (resolveSourceMapHook) {
    logger.debug(
      `Calling sourcemaps.resolveSourceMap(${JSON.stringify(bundlePath)}, ${JSON.stringify(sourceMappingUrl)})`
    );
    const customPath = await resolveSourceMapHook(bundlePath, sourceMappingUrl);
    logger.debug(`resolveSourceMap hook returned: ${JSON.stringify(customPath)}`);
    if (customPath) {
      searchLocations.push(customPath);
    }
  }
  if (sourceMappingUrl) {
    let parsedUrl;
    try {
      parsedUrl = new URL(sourceMappingUrl);
    } catch {
    }
    if (parsedUrl?.protocol === "file:") {
      searchLocations.push(url.fileURLToPath(sourceMappingUrl));
    } else if (parsedUrl) ; else if (path__default.isAbsolute(sourceMappingUrl)) {
      searchLocations.push(path__default.normalize(sourceMappingUrl));
    } else {
      searchLocations.push(path__default.normalize(path__default.join(path__default.dirname(bundlePath), sourceMappingUrl)));
    }
  }
  searchLocations.push(`${bundlePath}.map`);
  for (const searchLocation of searchLocations) {
    try {
      await util.promisify(fs__default.access)(searchLocation);
      logger.debug(`Source map found for bundle \`${bundlePath}\`: \`${searchLocation}\``);
      return searchLocation;
    } catch {
    }
  }
  logger.debug(
    `Could not determine source map path for bundle \`${bundlePath}\` with sourceMappingURL=${sourceMappingUrl === void 0 ? "undefined" : `\`${sourceMappingUrl}\``} - Did you turn on source map generation in your bundler? (Attempted paths: ${searchLocations.map((e) => `\`${e}\``).join(", ")})`
  );
  return void 0;
}
async function prepareSourceMapForDebugIdUpload(sourceMapPath, targetPath, debugId, rewriteSourcesHook, logger) {
  let sourceMapFileContent;
  try {
    sourceMapFileContent = await util.promisify(fs__default.readFile)(sourceMapPath, {
      encoding: "utf8"
    });
  } catch (e) {
    logger.error(`Failed to read source map for debug ID upload: ${sourceMapPath}`, e);
    return;
  }
  let map;
  try {
    map = JSON.parse(sourceMapFileContent);
    map["debug_id"] = debugId;
    map["debugId"] = debugId;
  } catch {
    logger.error(`Failed to parse source map for debug ID upload: ${sourceMapPath}`);
    return;
  }
  if (map["sources"] && Array.isArray(map["sources"])) {
    const mapDir = path__default.dirname(sourceMapPath);
    map["sources"] = map["sources"].map((source) => rewriteSourcesHook(source, map, { mapDir }));
  }
  try {
    await util.promisify(fs__default.writeFile)(targetPath, JSON.stringify(map), {
      encoding: "utf8"
    });
  } catch (e) {
    logger.error(`Failed to prepare source map for debug ID upload: ${sourceMapPath}`, e);
    return;
  }
}
const PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;
function defaultRewriteSourcesHook(source) {
  if (source.match(PROTOCOL_REGEX)) {
    return source.replace(PROTOCOL_REGEX, "");
  } else {
    return path__default.relative(process.cwd(), path__default.normalize(source));
  }
}

export { createDebugIdUploadFunction, defaultRewriteSourcesHook, determineSourceMapPathFromBundle, prepareBundleForDebugIdUpload };
//# sourceMappingURL=debug-id-upload.js.map
