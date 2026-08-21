"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openURLMiddleware = openURLMiddleware;
const getRawBody_1 = require("./getRawBody");
/*
 * Prefix for Sentry Metro logs to make them stand out to the user.
 */
const S = '\u001b[45;1m SENTRY \u001b[0m';
let open = undefined;
/**
 * Open a URL in the system browser.
 *
 * Inspired by https://github.com/react-native-community/cli/blob/a856ce027a6b25f9363a8689311cdd4416c0fc89/packages/cli-server-api/src/openURLMiddleware.ts#L17
 */
function openURLMiddleware(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method not allowed. Use POST.');
            return;
        }
        if (!open) {
            try {
                // oxlint-disable-next-line import/no-extraneous-dependencies
                const imported = require('open');
                // Handle both CJS (`module.exports = fn`) and ESM default export (`{ default: fn }`)
                // oxlint-disable-next-line typescript-eslint(no-unsafe-member-access)
                open = typeof imported === 'function' ? imported : imported === null || imported === void 0 ? void 0 : imported.default;
            }
            catch (e) {
                // noop
            }
        }
        const body = yield (0, getRawBody_1.getRawBody)(req);
        let url = undefined;
        try {
            const parsedBody = JSON.parse(body);
            url = parsedBody.url;
        }
        catch (e) {
            res.writeHead(400);
            res.end('Invalid request body. Expected a JSON object with a url key.');
            return;
        }
        if (!url) {
            res.writeHead(400);
            res.end('Invalid request body. Expected a JSON object with a url key.');
            return;
        }
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
            res.writeHead(400);
            res.end('Invalid URL scheme. Only http:// and https:// URLs are allowed.');
            return;
        }
        if (!isTrustedSentryHost(url)) {
            // oxlint-disable-next-line no-console
            console.log(`${S} Untrusted host, not opening automatically. Open manually if you trust this URL: ${sanitizeForLog(url)}`);
            res.writeHead(200);
            res.end();
            return;
        }
        if (!open) {
            // oxlint-disable-next-line no-console
            console.log(`${S} Could not open URL automatically. Open manually: ${sanitizeForLog(url)}`);
            res.writeHead(500);
            res.end('Failed to open URL. The "open" package is not available. Install it or open the URL manually.');
            return;
        }
        try {
            yield open(url);
        }
        catch (e) {
            // oxlint-disable-next-line no-console
            console.log(`${S} Failed to open URL automatically. Open manually: ${sanitizeForLog(url)}`);
            res.writeHead(500);
            res.end('Failed to open URL.');
            return;
        }
        // oxlint-disable-next-line no-console
        console.log(`${S} Opened URL: ${sanitizeForLog(url)}`);
        res.writeHead(200);
        res.end();
    });
}
/**
 * Strip control characters to prevent terminal escape sequence injection when logging URLs.
 */
function sanitizeForLog(value) {
    // oxlint-disable-next-line no-control-regex
    return value.replace(/[\x00-\x1f\x7f]/g, '');
}
function isTrustedSentryHost(url) {
    try {
        const { hostname } = new URL(url);
        return hostname === 'sentry.io' || hostname.endsWith('.sentry.io');
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=openUrlMiddleware.js.map