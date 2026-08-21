"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnOnce = warnOnce;
exports.prefix = prefix;
exports.yellow = yellow;
exports.bold = bold;
const warningMap = new Map();
/**
 * Log a warning message only once per run.
 * This is used to avoid spamming the console with the same message.
 */
function warnOnce(message) {
    if (!warningMap.has(message)) {
        warningMap.set(message, true);
        // oxlint-disable-next-line eslint(no-console), typescript-eslint(no-unsafe-member-access)
        console.warn(yellow(prefix(message)));
    }
}
/**
 * Prefix message with `› [value]`.
 *
 * Example:
 * ```
 * › [@sentry/react-native/expo] This is a warning message
 * ```
 */
function prefix(value) {
    return `› ${bold('[@sentry/react-native/expo]')} ${value}`;
}
/**
 * The same as `chalk.yellow`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
function yellow(message) {
    return `\x1b[33m${message}\x1b[0m`;
}
/**
 * The same as `chalk.bold`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
function bold(message) {
    return `\x1b[1m${message}\x1b[22m`;
}
