/**
 * Web shim for react-native-safe-area-context.
 *
 * The package's RN entry and its lib/module graph import flow-syntax codegen
 * internals that esbuild cannot parse. Desktop windows have no notches, so
 * the entire shim is trivial: a pass-through provider + zero-insets hooks +
 * a plain-View SafeAreaView. No imports from the package at all.
 */
import React from 'react';
import { View } from 'react-native';

export interface EdgeInsets {
  top: number; bottom: number; left: number; right: number;
}
export interface Frame {
  x: number; y: number; width: number; height: number;
}

const ZeroInsets: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export function SafeAreaProvider({ children, style }: { children?: React.ReactNode; style?: object }): React.JSX.Element {
  return <View style={style}>{children as never}</View>;
}

export function useSafeAreaInsets(): EdgeInsets {
  return ZeroInsets;
}

export function useSafeAreaFrame(): Frame {
  return {
    x: 0,
    y: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  };
}

export function SafeAreaView(props: React.ComponentProps<typeof View>): React.JSX.Element {
  return <View {...props} />;
}
