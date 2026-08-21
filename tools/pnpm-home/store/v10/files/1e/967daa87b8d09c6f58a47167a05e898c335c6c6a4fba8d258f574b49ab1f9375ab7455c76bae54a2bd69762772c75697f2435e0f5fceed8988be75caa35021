import path__default from 'node:path';
import MagicString from 'magic-string';
import { KNOWN_INCOMPATIBLE_PLUGINS } from '../babel-plugin/constants.js';
import { stripQueryAndHashFromPath } from './utils.js';
import { isAstNode } from './component-annotation-vite-ast.js';
import { collectViteComponentAnnotationInsertions } from './component-annotation-vite-walk.js';

const JSX_TAG_START_REGEXP = /<[$_\p{ID_Start}][$_\u200c\u200d\p{ID_Continue}.:-]*|<>/u;
const JSX_FILE_REGEXP = /\.[jt]sx$/;
function isViteAnnotationFile(idWithoutQueryAndHash) {
  if (idWithoutQueryAndHash.match(/\\node_modules\\|\/node_modules\//)) {
    return false;
  }
  return JSX_FILE_REGEXP.test(idWithoutQueryAndHash);
}
function shouldTryParse(code) {
  return JSX_TAG_START_REGEXP.test(code);
}
function shouldSkipIncompatibleFile(idWithoutQueryAndHash) {
  return KNOWN_INCOMPATIBLE_PLUGINS.some((pluginName) => {
    return idWithoutQueryAndHash.includes(`/node_modules/${pluginName}/`) || idWithoutQueryAndHash.includes(`\\node_modules\\${pluginName}\\`);
  });
}
function escapeAttributeValue(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function makeAttributeText(code, insertionOffset, attributes) {
  const previousCharIsWhitespace = insertionOffset > 0 && /\s/.test(code[insertionOffset - 1] ?? "");
  const prefix = previousCharIsWhitespace ? "" : " ";
  const suffix = previousCharIsWhitespace && code[insertionOffset] === "/" ? " " : "";
  const attributeText = attributes.map(([name, value]) => `${name}="${escapeAttributeValue(value)}"`).join(" ");
  return `${prefix}${attributeText}${suffix}`;
}
function getMagicString(code, meta) {
  if (meta?.magicString) {
    return { magicString: meta.magicString, isNative: true };
  }
  return { magicString: new MagicString(code), isNative: false };
}
async function annotateWithViteParser(code, id, ignoredComponents, parseAstAsync, meta) {
  const idWithoutQueryAndHash = stripQueryAndHashFromPath(id);
  if (!idWithoutQueryAndHash || !isViteAnnotationFile(idWithoutQueryAndHash) || !shouldTryParse(code) || shouldSkipIncompatibleFile(idWithoutQueryAndHash)) {
    return null;
  }
  const ast = await parseAstAsync(code, {
    lang: idWithoutQueryAndHash.endsWith(".jsx") ? "jsx" : "tsx"
  });
  if (!isAstNode(ast)) {
    return void 0;
  }
  const insertions = collectViteComponentAnnotationInsertions(
    code,
    ast,
    ignoredComponents,
    path__default.basename(idWithoutQueryAndHash)
  );
  if (insertions.length === 0) {
    return null;
  }
  const { magicString, isNative } = getMagicString(code, meta);
  for (const insertion of insertions) {
    magicString.appendLeft(insertion.offset, makeAttributeText(code, insertion.offset, insertion.attributes));
  }
  if (isNative) {
    return { code: magicString };
  }
  return {
    code: magicString.toString(),
    map: magicString.generateMap?.({
      file: id,
      source: idWithoutQueryAndHash,
      includeContent: true,
      hires: true
    })
  };
}
function createViteComponentNameAnnotateHooks(ignoredComponents, getParseAstAsync) {
  return {
    async transform(code, id, meta) {
      try {
        const parseAstAsync = await getParseAstAsync();
        if (!parseAstAsync) {
          return void 0;
        }
        return await annotateWithViteParser(code, id, ignoredComponents, parseAstAsync, meta);
      } catch {
        return void 0;
      }
    }
  };
}

export { createViteComponentNameAnnotateHooks };
//# sourceMappingURL=component-annotation-vite.js.map
