import { isExpo } from '../utils/environment';
import { getExpoConstants } from '../utils/expomodules';
const INTEGRATION_NAME = 'ExpoConstants';
export const EXPO_CONSTANTS_CONTEXT_KEY = 'expo_constants';
/** Load Expo Constants as event context. */
export const expoConstantsIntegration = () => {
    let _expoConstantsContextCached;
    function processEvent(event) {
        if (!isExpo()) {
            return event;
        }
        event.contexts = event.contexts || {};
        event.contexts[EXPO_CONSTANTS_CONTEXT_KEY] = Object.assign({}, getExpoConstantsContextCached());
        return event;
    }
    function getExpoConstantsContextCached() {
        if (_expoConstantsContextCached) {
            return _expoConstantsContextCached;
        }
        return (_expoConstantsContextCached = getExpoConstantsContext());
    }
    return {
        name: INTEGRATION_NAME,
        processEvent,
    };
};
/**
 * @internal Exposed for testing purposes
 */
export function getExpoConstantsContext() {
    const expoConstants = getExpoConstants();
    if (!expoConstants) {
        return {};
    }
    const context = {};
    addStringField(context, 'execution_environment', expoConstants.executionEnvironment);
    addStringField(context, 'app_ownership', expoConstants.appOwnership);
    addBooleanField(context, 'debug_mode', expoConstants.debugMode);
    addStringField(context, 'expo_version', expoConstants.expoVersion);
    addStringField(context, 'expo_runtime_version', expoConstants.expoRuntimeVersion);
    addStringField(context, 'session_id', expoConstants.sessionId);
    addNumberField(context, 'status_bar_height', expoConstants.statusBarHeight);
    addExpoConfigFields(context, expoConstants);
    addEasConfigFields(context, expoConstants);
    return context;
}
function addStringField(context, key, value) {
    if (typeof value === 'string' && value) {
        context[key] = value;
    }
}
function addBooleanField(context, key, value) {
    if (typeof value === 'boolean') {
        context[key] = value;
    }
}
function addNumberField(context, key, value) {
    if (typeof value === 'number') {
        context[key] = value;
    }
}
function addExpoConfigFields(context, expoConstants) {
    if (!expoConstants.expoConfig) {
        return;
    }
    addStringField(context, 'app_name', expoConstants.expoConfig.name);
    addStringField(context, 'app_slug', expoConstants.expoConfig.slug);
    addStringField(context, 'app_version', expoConstants.expoConfig.version);
    addStringField(context, 'expo_sdk_version', expoConstants.expoConfig.sdkVersion);
}
function addEasConfigFields(context, expoConstants) {
    if (!expoConstants.easConfig) {
        return;
    }
    addStringField(context, 'eas_project_id', expoConstants.easConfig.projectId);
}
//# sourceMappingURL=expoconstants.js.map