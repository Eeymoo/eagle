import { debug } from '@sentry/core';
import { getDevServer } from '../integrations/debugsymbolicatorutils';
import { SENTRY_OPEN_URL_REQUEST_PATH } from './constants';
/**
 * Send request to the Metro Development Server Middleware to open a URL in the system browser.
 */
export function openURLInBrowser(url) {
    var _a;
    // oxlint-disable-next-line typescript-eslint(no-floating-promises)
    fetch(`${((_a = getDevServer()) === null || _a === void 0 ? void 0 : _a.url) || '/'}${SENTRY_OPEN_URL_REQUEST_PATH}`, {
        method: 'POST',
        body: JSON.stringify({ url }),
    }).catch(e => {
        debug.error('Error opening URL:', e);
    });
}
//# sourceMappingURL=openUrlInBrowser.js.map