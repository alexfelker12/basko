'use client';
// Basko: Toast mit Aktion (Komponenten 10a) – ink-Hintergrund, bg-Text,
// Aktion wie „Rückgängig“ in amber. Basis: gluestack Toast, auf einen Stil reduziert.
// Platzierung (96 px über dem unteren Rand) und Dauer setzt der Aufrufer über useToast().show().
import { createToastHook } from '@gluestack-ui/core/toast/creator';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { StyledAnimatedView } from '../utils/animated';
import React from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const useToast = createToastHook(View);

const toastStyle = tva({
  base: 'min-h-13 flex-row items-center gap-2.5 rounded-card bg-ink py-2 pl-4 pr-1.5 web:pointer-events-auto',
});

const toastTitleStyle = tva({
  base: 'flex-1 font-sans text-sm font-semibold text-bg',
});

const toastDescriptionStyle = tva({
  base: 'font-sans text-sm font-medium text-bg',
});

const toastActionStyle = tva({
  base: 'h-11 justify-center px-3 active:opacity-70',
});

const toastActionTextStyle = tva({
  base: 'font-sans text-sm font-extrabold text-amber',
});

type IToastProps = React.ComponentProps<typeof StyledAnimatedView> & {
  className?: string;
} & VariantProps<typeof toastStyle>;

const Toast = React.forwardRef<
  React.ComponentRef<typeof View>,
  IToastProps
>(function Toast({ className, ...props }, ref) {
  return (
    <StyledAnimatedView
      ref={ref}
      entering={FadeInDown}
      exiting={FadeOutDown}
      className={toastStyle({ class: className })}
      {...props}
    />
  );
});

type IToastTitleProps = React.ComponentProps<typeof Text> & {
  className?: string;
};

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IToastTitleProps
>(function ToastTitle({ className, children, ...props }, ref) {
  React.useEffect(() => {
    if (typeof children === 'string') {
      AccessibilityInfo.announceForAccessibility(children);
    }
  }, [children]);

  return (
    <Text
      {...props}
      ref={ref}
      aria-live="assertive"
      aria-atomic="true"
      role="alert"
      className={toastTitleStyle({ class: className })}
    >
      {children}
    </Text>
  );
});

type IToastDescriptionProps = React.ComponentProps<typeof Text> & {
  className?: string;
};

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IToastDescriptionProps
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <Text
      ref={ref}
      {...props}
      className={toastDescriptionStyle({ class: className })}
    />
  );
});

type IToastActionProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> & {
  className?: string;
  label: string;
};

/** Text-Aktion im Toast, z. B. „Rückgängig“ (amber). */
const ToastAction = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IToastActionProps
>(function ToastAction({ className, label, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      role="button"
      hitSlop={4}
      className={toastActionStyle({ class: className })}
      {...props}
    >
      <Text className={toastActionTextStyle({})}>{label}</Text>
    </Pressable>
  );
});

Toast.displayName = 'Toast';
ToastTitle.displayName = 'ToastTitle';
ToastDescription.displayName = 'ToastDescription';
ToastAction.displayName = 'ToastAction';

export { Toast, ToastAction, ToastDescription, ToastTitle, useToast };
