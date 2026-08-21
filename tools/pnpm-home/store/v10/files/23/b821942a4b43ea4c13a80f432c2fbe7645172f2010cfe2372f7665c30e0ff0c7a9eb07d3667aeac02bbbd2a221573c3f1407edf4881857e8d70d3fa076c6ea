Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const webpack4and5 = require('./webpack4and5.js');
const node_module = require('node:module');
const index = require('../core/index.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function loadWebpack() {
  try {
    return node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('webpack/index.js', document.baseURI).href)))("webpack");
  } catch {
    return {};
  }
}
const webpack = loadWebpack();
const BannerPlugin = webpack.BannerPlugin ?? webpack.default?.BannerPlugin;
const DefinePlugin = webpack.DefinePlugin ?? webpack.default?.DefinePlugin;
const sentryWebpackPlugin = webpack4and5.sentryWebpackPluginFactory({
  BannerPlugin,
  DefinePlugin
});

exports.sentryCliBinaryExists = index.sentryCliBinaryExists;
exports.sentryWebpackPlugin = sentryWebpackPlugin;
//# sourceMappingURL=index.js.map
