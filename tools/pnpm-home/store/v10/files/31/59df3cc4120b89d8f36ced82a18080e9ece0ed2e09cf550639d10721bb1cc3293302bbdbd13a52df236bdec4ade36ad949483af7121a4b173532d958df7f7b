import { _rollupPluginInternal } from '../rollup/index.js';
import { createRequire } from 'node:module';
export { sentryCliBinaryExists } from '../core/index.js';

function getViteMajorVersion() {
  try {
    const req = createRequire(import.meta.url);
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
      ..._rollupPluginInternal(options, "vite", getViteMajorVersion())
    }
  ];
};

export { sentryVitePlugin };
//# sourceMappingURL=index.js.map
