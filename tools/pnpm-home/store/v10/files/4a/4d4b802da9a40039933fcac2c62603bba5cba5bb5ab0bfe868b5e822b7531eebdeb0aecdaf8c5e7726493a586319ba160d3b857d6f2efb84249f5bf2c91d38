"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSentryPropertiesTo = writeSentryPropertiesTo;
exports.writeSentryOptions = writeSentryOptions;
// tsgolint incorrectly types `fs` as `error` — false positive with DANGEROUSLY_SUPPRESS_PROGRAM_DIAGNOSTICS
/* oxlint-disable typescript-eslint(no-unsafe-member-access) */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
function writeSentryPropertiesTo(filepath, sentryProperties) {
    if (!fs.existsSync(filepath)) {
        throw new Error(`Directory '${filepath}' does not exist.`);
    }
    fs.writeFileSync(path.resolve(filepath, 'sentry.properties'), sentryProperties);
}
const SENTRY_OPTIONS_FILE_NAME = 'sentry.options.json';
function writeSentryOptions(projectRoot, pluginOptions) {
    const optionsFilePath = path.resolve(projectRoot, SENTRY_OPTIONS_FILE_NAME);
    let existingOptions = {};
    if (fs.existsSync(optionsFilePath)) {
        try {
            existingOptions = JSON.parse(fs.readFileSync(optionsFilePath, 'utf8'));
        }
        catch (e) {
            (0, logger_1.warnOnce)(`Failed to parse ${SENTRY_OPTIONS_FILE_NAME}: ${e}. These options will not be set.`);
            return;
        }
    }
    const mergedOptions = { ...existingOptions, ...pluginOptions };
    fs.writeFileSync(optionsFilePath, `${JSON.stringify(mergedOptions, null, 2)}\n`);
}
