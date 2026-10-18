'use client';
import { ActivityIndicator } from 'react-native';
import React from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';


// Basko: `nativeStyleMapping` statt `nativeStyleToProp` aus der Vorlage – react-native-css 3 liest
// zur Laufzeit nur noch `nativeStyleMapping`, sonst kam `text-primary` nie als `color` an und
// Android zeigte die Systemfarbe (türkis). Wie `ActivityIndicator` aus react-native-css selbst.
const StyledActivityIndicator = styled(ActivityIndicator, {
  className: { target: 'style', nativeStyleMapping: { color: 'color' } },
});
const spinnerStyle = tva({});

const Spinner = React.forwardRef<
  React.ComponentRef<typeof ActivityIndicator>,
  React.ComponentProps<typeof ActivityIndicator>
>(function Spinner(
  {
    className,
    focusable = false,
    'aria-label': ariaLabel = 'loading',
    ...props
  },
  ref
) {
  return (
    <StyledActivityIndicator
      ref={ref}
      focusable={focusable}
      aria-label={ariaLabel}
      // `color` nur über `props`: ein explizites `color={undefined}` überschriebe die Klassenfarbe
      {...props}
      className={spinnerStyle({ class: className })}
    />
  );
});

Spinner.displayName = 'Spinner';

export { Spinner };
