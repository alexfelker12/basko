import React from 'react';
import { createIcon } from '@gluestack-ui/core/icon/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import {
  PrimitiveIcon,
  IPrimitiveIcon,
  Svg,
} from '@gluestack-ui/core/icon/creator';

/*
 * Basko: Die Icons kommen aus lucide-react-native (`<Icon as={ChevronRightIcon} />`). Die ~50
 * eigenen SVG-Icons der gluestack-Vorlage (AddIcon, CheckIcon …) und `createIcon` waren unbenutzt
 * und sind entfernt – sie wurden beim Laden des Moduls trotzdem alle erzeugt.
 */

export const UIIcon = createIcon({
  Root: PrimitiveIcon,
}) as React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof PrimitiveIcon> &
  React.RefAttributes<React.ComponentRef<typeof Svg>>
>;

const iconStyle = tva({
  base: 'text-ink fill-none pointer-events-none',
  variants: {
    size: {
      '2xs': 'h-3 w-3',
      'xs': 'h-3.5 w-3.5',
      'sm': 'h-4 w-4',
      'md': 'h-4.5 w-4.5',
      'lg': 'h-5 w-5',
      'xl': 'h-6 w-6',
    },
  },
});

const StyledUIIcon = styled(UIIcon, { className: "style" });

type IIConProps = IPrimitiveIcon &
  VariantProps<typeof iconStyle> &
  React.ComponentPropsWithoutRef<typeof UIIcon>;

const Icon = React.forwardRef<React.ComponentRef<typeof UIIcon>, IIConProps>(
  function Icon({ size = 'md', className, ...props }, ref) {
    if (typeof size === 'number') {
      return (
        <StyledUIIcon
          ref={ref}
          {...props}
          className={iconStyle({ class: className })}
          size={size}
        />
      );
    } else if (
      (props.height !== undefined || props.width !== undefined) &&
      size === undefined
    ) {
      return (
        <StyledUIIcon
          ref={ref}
          {...props}
          className={iconStyle({ class: className })}
        />
      );
    }
    return (
      <StyledUIIcon
        ref={ref}
        {...props}
        className={iconStyle({ size, class: className })}
      />
    );
  }
);

export { Icon };
