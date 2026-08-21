import { sentryWebpackPluginFactory } from './webpack4and5.js';
import { createRequire } from 'node:module';
export { sentryCliBinaryExists } from '../core/index.js';

function loadWebpack() {
  try {
    return createRequire(import.meta.url)("webpack");
  } catch {
    return {};
  }
}
const webpack = loadWebpack();
const BannerPlugin = webpack.BannerPlugin ?? webpack.default?.BannerPlugin;
const DefinePlugin = webpack.DefinePlugin ?? webpack.default?.DefinePlugin;
const sentryWebpackPlugin = sentryWebpackPluginFactory({
  BannerPlugin,
  DefinePlugin
});

export { sentryWebpackPlugin };
//# sourceMappingURL=index.js.map
