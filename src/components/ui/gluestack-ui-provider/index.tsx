import React, { useLayoutEffect } from 'react';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';

import { applyColorScheme, type ThemeMode } from '@/lib/theme';

export type ModeType = ThemeMode;

export function GluestackUIProvider({
  mode = 'system',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  // Basko: „system“ muss als „unspecified“ an Appearance gehen (RN 0.86).
  useLayoutEffect(() => {
    applyColorScheme(mode);
  }, [mode]);

  return (
    <View
      style={[
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      {/* Toasts rendern selbst über ein Overlay – OverlayProvider muss außen liegen */}
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
