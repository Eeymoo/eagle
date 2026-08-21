/**
 * In-app toast — the modern replacement for RN's Alert.alert popups.
 * Renders a floating pill at the bottom; auto-dismisses. No native dialogs.
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from './theme.js';

type ToastKind = 'info' | 'success' | 'error';

interface ToastOptions {
  message: string;
  kind?: ToastKind;
  /** ms until auto-dismiss (default 2600). */
  duration?: number;
}

interface ToastApi {
  show: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const show = useCallback(
    (opts: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      const id = ++seq.current;
      setToast({ ...opts, id });
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(hide, opts.duration ?? 2600);
    },
    [hide, opacity],
  );

  const api = useMemo(() => ({ show }), [show]);

  const kindColor =
    toast?.kind === 'error' ? t.colors.danger : toast?.kind === 'success' ? '#3dd68c' : t.colors.accent;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { bottom: insets.bottom + 56, opacity }]}
        >
          <Pressable onPress={hide} style={[styles.pill, { borderColor: kindColor }]}>
            <View style={[styles.dot, { backgroundColor: kindColor }]} />
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '86%',
    backgroundColor: t.colors.bgSurfaceRaised,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  message: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeSm, flexShrink: 1 },
});
