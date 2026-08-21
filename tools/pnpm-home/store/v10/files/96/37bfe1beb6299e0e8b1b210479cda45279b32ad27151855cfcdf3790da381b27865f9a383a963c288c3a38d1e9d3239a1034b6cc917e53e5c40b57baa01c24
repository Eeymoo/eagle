'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const node_util_1 = require("node:util");
class Logger {
    constructor(stream) {
        this.stream = stream;
    }
    log() {
        const message = (0, node_util_1.format)(...arguments);
        this.stream.write(`[sentry-cli] ${message}\n`);
    }
}
exports.Logger = Logger;
;
