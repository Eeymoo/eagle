"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRawBody = getRawBody;
/**
 * Get the raw body of a request.
 */
function getRawBody(request) {
    return new Promise((resolve, reject) => {
        let data = '';
        request.on('data', chunk => {
            data += chunk;
        });
        request.on('end', () => {
            resolve(data);
        });
        request.on('error', reject);
    });
}
//# sourceMappingURL=getRawBody.js.map