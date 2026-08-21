import * as React from 'react';
import { Animated, Image, Modal, Platform, Pressable, Text, useColorScheme, View } from 'react-native';
import { openURLInBrowser } from '../metro/openUrlInBrowser';
import { isExpoGo, isWeb } from '../utils/environment';
import { bug as bugAnimation, hi as hiAnimation, thumbsup as thumbsupAnimation } from './animations';
import { nativeCrashExample, tryCatchExample, uncaughtErrorExample } from './examples';
import { bug as bugImage, hi as hiImage, thumbsup as thumbsupImage } from './images';
import { defaultDarkStyles, lightStyles } from './modal.styles';
/**
 * Wrapper to add Sentry Playground to your application
 * to test your Sentry React Native SDK setup.
 *
 * @example
 * ```tsx
 * import * as Sentry from '@sentry/react-native';
 * import { withSentryPlayground } from '@sentry/react-native/playground';
 *
 * function App() {
 *   return <View>...</View>;
 * }
 *
 * export default withSentryPlayground(Sentry.wrap(App), {
 *   projectId: '123456',
 *   organizationSlug: 'my-org'
 * });
 * ```
 */
export const withSentryPlayground = (Component, options = {}) => {
    const Wrapper = (props) => {
        return (React.createElement(React.Fragment, null,
            React.createElement(SentryPlayground, { projectId: options.projectId, organizationSlug: options.organizationSlug }),
            React.createElement(Component, Object.assign({}, props))));
    };
    Wrapper.displayName = 'withSentryPlayground()';
    return Wrapper;
};
export const SentryPlayground = ({ projectId, organizationSlug, }) => {
    const issuesStreamUrl = projectId && organizationSlug
        ? `https://${organizationSlug}.sentry.io/issues/?project=${projectId}&statsPeriod=1h`
        : 'https://sentry.io/';
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    const [show, setShow] = React.useState(true);
    const [animation, setAnimation] = React.useState('hi');
    const onAnimationPress = () => {
        switch (animation) {
            case 'hi':
                setAnimation('thumbsup');
                break;
            default:
                setAnimation('hi');
        }
    };
    const isNativeCrashDisabled = isWeb() || isExpoGo() || __DEV__;
    const animationContainerYPosition = React.useRef(new Animated.Value(0)).current;
    const springAnimation = Animated.sequence([
        Animated.timing(animationContainerYPosition, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
        }),
        Animated.spring(animationContainerYPosition, {
            toValue: 0,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }),
    ]);
    const changeAnimationToBug = (func) => {
        setAnimation('bug');
        springAnimation.start(() => {
            func();
        });
    };
    return (React.createElement(Modal, { presentationStyle: "formSheet", visible: show, animationType: "slide", onRequestClose: () => {
            setShow(false);
        } },
        React.createElement(View, { style: styles.background },
            React.createElement(View, { style: styles.container },
                React.createElement(Text, { style: styles.welcomeText }, "Welcome to Sentry Playground!"),
                React.createElement(Animated.View, { style: {
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ translateY: animationContainerYPosition }],
                    }, onTouchEnd: () => {
                        springAnimation.start();
                    } },
                    React.createElement(Pressable, { onPress: onAnimationPress },
                        React.createElement(Animation, { id: animation }))),
                React.createElement(View, { style: styles.listContainer },
                    React.createElement(Row, { title: 'captureException()', description: 'In a try-catch scenario, errors can be reported using manual APIs.', actionDescription: 'Try', action: tryCatchExample }),
                    React.createElement(Row, { title: 'throw new Error()', description: 'Uncaught errors are automatically reported by the React Native Global Handler.', actionDescription: 'Throw', action: () => changeAnimationToBug(uncaughtErrorExample) }),
                    React.createElement(Row, { title: 'throw RuntimeException()', description: isNativeCrashDisabled
                            ? 'For testing native crashes, build the mobile application in release mode.'
                            : 'Unhandled errors in native layers such as Java, Objective-C, C, Swift, or Kotlin are automatically reported.', actionDescription: 'Crash', action: nativeCrashExample, last: true, disabled: isNativeCrashDisabled })),
                React.createElement(View, { style: { marginTop: 40 } }),
                React.createElement(View, { style: {
                        width: '100%',
                        flexDirection: 'row', // Arrange buttons horizontally
                        justifyContent: 'space-evenly', // Space between buttons
                    } },
                    React.createElement(Button, { secondary: true, title: 'Open Sentry', onPress: () => {
                            openURLInBrowser(issuesStreamUrl);
                        } }),
                    React.createElement(Button, { title: 'Go to my App', onPress: () => {
                            setShow(false);
                        } }))))));
};
const Animation = ({ id }) => {
    const shouldFallbackToImage = Platform.OS === 'android';
    switch (id) {
        case 'hi':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? hiImage : hiAnimation }, style: { width: 100, height: 100 } }));
        case 'bug':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? bugImage : bugAnimation }, style: { width: 100, height: 100 } }));
        case 'thumbsup':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? thumbsupImage : thumbsupAnimation }, style: { width: 100, height: 100 } }));
        default:
            return null;
    }
};
const Row = ({ last = false, action = () => { }, actionDescription = '', title, description, disabled = false, }) => {
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    return (React.createElement(View, { style: [styles.rowContainer, last && styles.lastRowContainer] },
        React.createElement(View, { style: { flexShrink: 1, paddingRight: 12 } },
            React.createElement(Text, { style: styles.rowTitle }, title),
            React.createElement(Text, { style: { color: 'rgb(146, 130, 170)', fontSize: 12 } }, description)),
        React.createElement(View, null,
            React.createElement(Button, { disabled: disabled, secondary: true, onPress: action, title: actionDescription }))));
};
const Button = ({ onPress, title, secondary, disabled = false, }) => {
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    return (React.createElement(View, { style: [styles.buttonBottomLayer, styles.buttonCommon, secondary && styles.buttonSecondaryBottomLayer] },
        React.createElement(Pressable, { style: ({ pressed }) => [
                styles.buttonMainContainer,
                pressed && styles.buttonMainContainerPressed,
                styles.buttonCommon,
                secondary && styles.buttonSecondaryContainer,
                disabled && styles.buttonDisabledContainer,
            ], onPress: onPress, disabled: disabled },
            React.createElement(Text, { style: [styles.buttonText, secondary && styles.buttonSecondaryText, disabled && styles.buttonDisabledText] }, title))));
};
//# sourceMappingURL=modal.js.map