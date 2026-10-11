'use client';
import { UIIcon } from '@gluestack-ui/core/icon/creator';
import { createInput } from '@gluestack-ui/core/input/creator';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva, useStyleContext, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

const SCOPE = 'INPUT';

const StyledUIIcon = styled(UIIcon, { className: "style" });

const UIInput = createInput({
  Root: withStyleContext(View, SCOPE),
  Icon: StyledUIIcon,
  Slot: Pressable,
  Input: TextInput,
});


// Basko: Input / Suchleiste – Radius 14, Fokus = 2 px primary-Rahmen.
// Größen: default = 48 (Spezifikation), sm = 44 (z. B. Inline-Umbenennen, gleich hoch wie die Listenzeile).
const inputStyle = tva({
  base: 'w-full flex-row items-center gap-2.5 overflow-hidden rounded-card border-2 border-line bg-surface px-2.5 data-[focus=true]:border-2 data-[focus=true]:border-primary data-[focus=true]:web:outline-none data-[invalid=true]:border-danger data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none',
  variants: {
    size: {
      default: 'h-12',
      sm: 'h-11',
    },
  },
});

const inputIconStyle = tva({
  base: 'justify-center items-center text-soft fill-none h-5 w-5',
});

const inputSlotStyle = tva({
  base: 'justify-center items-center web:disabled:cursor-not-allowed',
});

// Das Feld bekommt dieselbe Höhe wie der Rahmen, sonst sitzt der Text nicht mittig.
const inputFieldStyle = tva({
  base: 'flex-1 py-0 font-sans font-semibold text-base text-ink placeholder:text-soft web:outline-none web:cursor-text web:data-[disabled=true]:cursor-not-allowed',
  parentVariants: {
    size: {
      default: 'h-12',
      sm: 'h-11',
    },
  },
});

type IInputProps = React.ComponentProps<typeof UIInput> &
  VariantProps<typeof inputStyle> & { className?: string };
const Input = React.forwardRef<React.ComponentRef<typeof UIInput>, IInputProps>(
  function Input({ className, size = 'default', ...props }, ref) {
    return (
      <UIInput
        ref={ref}
        {...props}
        className={inputStyle({ size, class: className })}
        context={{ size }}
      />
    );
  }
);

type IInputIconProps = React.ComponentProps<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & {
    className?: string;
    height?: number;
    width?: number;
  };

const InputIcon = React.forwardRef<
  React.ComponentRef<typeof UIInput.Icon>,
  IInputIconProps
>(function InputIcon({ className, ...props }, ref) {
  return (
    <UIInput.Icon
      ref={ref}
      {...props}
      className={inputIconStyle({ class: className })}
    />
  );
});

type IInputSlotProps = React.ComponentProps<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<
  React.ComponentRef<typeof UIInput.Slot>,
  IInputSlotProps
>(function InputSlot({ className, ...props }, ref) {
  return (
    <UIInput.Slot
      ref={ref}
      {...props}
      className={inputSlotStyle({
        class: className,
      })}
    />
  );
});

type IInputFieldProps = React.ComponentProps<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<
  React.ComponentRef<typeof UIInput.Input>,
  IInputFieldProps
>(function InputField({ className, ...props }, ref) {
  const { size: parentSize } = useStyleContext(SCOPE);
  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={inputFieldStyle({
        parentVariants: { size: parentSize },
        class: className,
      })}
    />
  );
});

Input.displayName = 'Input';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputIcon, InputSlot };
