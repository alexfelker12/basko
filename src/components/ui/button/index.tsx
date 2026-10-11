'use client';
import { createButton } from '@gluestack-ui/core/button/creator';
import { UIIcon } from '@gluestack-ui/core/icon/creator';
import {
  tva,
  useStyleContext,
  withStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
const SCOPE = 'BUTTON';
const Root = withStyleContext(Pressable, SCOPE);
const StyledUIIcon = styled(UIIcon, {
  className: "style",
});
const UIButton = createButton({
  Root: Root,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: StyledUIIcon,
});
// Basko: Button primary / secondary / destructive (Höhe 44, Radius 999),
// Icon-Button rund 44 × 44 (size="icon"), Footer-Buttons in Modals 40 (size="sm").
const buttonStyle = tva({
  base: 'rounded-[999px] flex-row items-center justify-center gap-2 data-[focus-visible=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[disabled=true]:opacity-40',
  variants: {
    variant: {
      primary: 'bg-primary data-[active=true]:opacity-85',
      secondary: 'bg-chip data-[active=true]:opacity-85',
      destructive: 'bg-danger data-[active=true]:opacity-85',
      ghost: 'bg-transparent data-[active=true]:bg-chip',
      link: 'bg-transparent data-[active=true]:opacity-70',
    },
    size: {
      default: 'h-11 px-5',
      sm: 'h-10 px-4',
      icon: 'size-11',
    },
  },
});
const buttonTextStyle = tva({
  base: 'web:select-none font-sans font-bold',
  parentVariants: {
    variant: {
      primary: 'text-primary-ink',
      secondary: 'text-ink',
      destructive: 'text-white',
      ghost: 'text-ink',
      link: 'text-primary',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      icon: 'text-base',
    },
  },
});

const buttonSpinnerStyle = tva({
  base: '',
  parentVariants: {
    size: {
      default: 'h-5 w-5',
      sm: 'h-4 w-4',
      icon: 'h-5 w-5',
    },
  },
});

const buttonIconStyle = tva({
  base: 'fill-none pointer-events-none shrink-0',
  parentVariants: {
    variant: {
      primary: 'text-primary-ink',
      secondary: 'text-ink',
      destructive: 'text-white',
      ghost: 'text-ink',
      link: 'text-primary',
    },
    size: {
      default: 'h-5 w-5',
      sm: 'h-4 w-4',
      icon: 'h-5 w-5',
    },
  },
});
const buttonGroupStyle = tva({
  base: '',
  variants: {
    space: {
      'xs': 'gap-1',
      'sm': 'gap-2',
      'md': 'gap-3',
      'lg': 'gap-4',
      'xl': 'gap-5',
      '2xl': 'gap-6',
      '3xl': 'gap-7',
      '4xl': 'gap-8',
    },
    isAttached: {
      true: 'gap-0',
    },
    flexDirection: {
      'row': 'flex-row',
      'column': 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
  },
});
type IButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIButton>,
  'context'
> &
  VariantProps<typeof buttonStyle> & { className?: string };
const Button = React.forwardRef<
  React.ElementRef<typeof UIButton>,
  IButtonProps
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  return (
    <UIButton
      ref={ref}
      {...props}
      className={buttonStyle({ variant, size, class: className })}
      context={{ variant, size }}
    />
  );
});
type IButtonTextProps = React.ComponentPropsWithoutRef<typeof UIButton.Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string };
const ButtonText = React.forwardRef<
  React.ElementRef<typeof UIButton.Text>,
  IButtonTextProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);
  return (
    <UIButton.Text
      ref={ref}
      {...props}
      className={buttonTextStyle({
        parentVariants: {
          size: parentSize,
          variant: parentVariant,
        },
        size,
        class: className,
      })}
    />
  );
});
const ButtonSpinner = React.forwardRef<
  React.ElementRef<typeof UIButton.Spinner>,
  React.ComponentPropsWithoutRef<typeof UIButton.Spinner>
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);
  return <UIButton.Spinner ref={ref} {...props} className={buttonSpinnerStyle({ parentVariants: { size: parentSize }, class: className })} />;
});
type IButtonIcon = React.ComponentPropsWithoutRef<typeof UIButton.Icon> &
  VariantProps<typeof buttonIconStyle> & {
    className?: string | undefined;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };
const ButtonIcon = React.forwardRef<
  React.ElementRef<typeof UIButton.Icon>,
  IButtonIcon
>(({ className, size, ...props }, ref) => {
  const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);
  if (typeof size === 'number') {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
        size={size}
      />
    );
  } else if (
    (props.height !== undefined || props.width !== undefined) &&
    size === undefined
  ) {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
      />
    );
  }
  return (
    <UIButton.Icon
      {...props}
      className={buttonIconStyle({
        parentVariants: {
          size: parentSize,
          variant: parentVariant,
        },
        size,
        class: className,
      })}
      ref={ref}
    />
  );
});
type IButtonGroupProps = React.ComponentPropsWithoutRef<typeof UIButton.Group> &
  VariantProps<typeof buttonGroupStyle>;
const ButtonGroup = React.forwardRef<
  React.ElementRef<typeof UIButton.Group>,
  IButtonGroupProps
>(
  (
    {
      className,
      space = 'md',
      isAttached = false,
      flexDirection = 'column',
      ...props
    },
    ref
  ) => {
    return (
      <UIButton.Group
        className={buttonGroupStyle({
          class: className,
          space,
          isAttached,
          flexDirection,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);
Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
ButtonSpinner.displayName = 'ButtonSpinner';
ButtonIcon.displayName = 'ButtonIcon';
ButtonGroup.displayName = 'ButtonGroup';
export { Button, ButtonGroup, ButtonIcon, ButtonSpinner, ButtonText };
