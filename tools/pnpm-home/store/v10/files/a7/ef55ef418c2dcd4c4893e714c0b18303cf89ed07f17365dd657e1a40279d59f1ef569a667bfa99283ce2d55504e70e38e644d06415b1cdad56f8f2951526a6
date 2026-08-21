Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const index$1 = require('../rollup/index.js');
const node_module = require('node:module');
const index = require('../core/index.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function getViteMajorVersion() {
  try {
    const req = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('vite/index.js', document.baseURI).href)));
    const vite = req("vite");
    return vite.version?.split(".")[0];
  } catch {
  }
  return void 0;
}
const sentryVitePlugin = (options) => {
  return [
    {
      enforce: "pre",
      ...index$1._rollupPluginInternal(options, "vite", getViteMajorVersion())
    }
  ];
};

exports.sentryCliBinaryExists = index.sentryCliBinaryExists;
exports.sentryVitePlugin = sentryVitePlugin;
//# sourceMappingURL=index.js.map
