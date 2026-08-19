/**
 * Expo dev-client entry: the whole app is the RN head from @eagle/rn-ui-plugin.
 * This shell contains zero UI — composition happens inside EagleApp.
 */
import { registerRootComponent } from 'expo';
import { EagleApp } from '@eagle/rn-ui-plugin';

registerRootComponent(EagleApp);
