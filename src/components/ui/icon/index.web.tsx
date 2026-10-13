import React from 'react';
import { createIcon } from '@gluestack-ui/core/icon/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { PrimitiveIcon } from '@gluestack-ui/core/icon/creator';

// Basko: Vorlagen-Icons entfernt, Icons kommen aus lucide-react-native (siehe index.tsx).

export const UIIcon = createIcon({
  Root: PrimitiveIcon,
});

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

export const Icon = React.forwardRef<
  React.ComponentRef<typeof UIIcon>,
  React.ComponentPropsWithoutRef<typeof UIIcon> &
    VariantProps<typeof iconStyle> & {
      height?: number | string;
      width?: number | string;
    }
>(function Icon({ size = 'md', className, ...props }, ref) {
  if (typeof size === 'number') {
    return (
      <UIIcon
        // @ts-expect-error : TODO: fix this
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
      <UIIcon
        // @ts-expect-error : TODO: fix this
        ref={ref}
        {...props}
        className={iconStyle({ class: className })}
      />
    );
  }
  return (
    <UIIcon
      // @ts-expect-error : TODO: fix this
      ref={ref}
      {...props}
      className={iconStyle({ size, class: className })}
    />
  );
});
