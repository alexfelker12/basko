'use client';
import { createModal } from '@gluestack-ui/core/modal/creator';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva, useStyleContext, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { StyledAnimatedPressable, StyledAnimatedView } from '../utils/animated';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn
} from 'react-native-reanimated';

const SCOPE = 'MODAL';

const UIModal = createModal({
  Root: withStyleContext(View as any, SCOPE),
  Backdrop: StyledAnimatedPressable,
  Content: StyledAnimatedView,
  Body: ScrollView,
  CloseButton: Pressable,
  Footer: View,
  Header: View,
});


const modalStyle = tva({
  base: 'group/modal w-full h-full justify-center items-center web:pointer-events-none',
  variants: {
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
  },
});

const modalBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-black/50 web:cursor-default',
});

const modalContentStyle = tva({
  base: 'max-h-[85vh] overflow-hidden rounded-card border border-line bg-surface',
  parentVariants: {
    size: {
      xs: 'w-[60%] max-w-90',
      sm: 'w-[70%] max-w-105',
      md: 'w-[80%] max-w-127.5',
      lg: 'w-[90%] max-w-160',
      full: 'w-full',
    },
  },
});

const modalBodyStyle = tva({
  base: 'px-page',
});

const modalCloseButtonStyle = tva({
  base: 'group/modal-close-button z-10 rounded data-[focus-visible=true]:web:bg-bg/90 web:outline-0 cursor-pointer',
});

const modalHeaderStyle = tva({
  base: 'flex-row items-center justify-between border-b border-line px-page pb-3 pt-4',
});

const modalFooterStyle = tva({
  base: 'flex-row items-center justify-end gap-2 border-t border-line px-page py-2.5',
});

type IModalProps = React.ComponentProps<typeof UIModal> &
  VariantProps<typeof modalStyle> & { className?: string };

type IModalBackdropProps = React.ComponentProps<typeof UIModal.Backdrop> &
  VariantProps<typeof modalBackdropStyle> & { className?: string };

type IModalContentProps = React.ComponentProps<typeof UIModal.Content> &
  VariantProps<typeof modalContentStyle> & { className?: string };

type IModalHeaderProps = React.ComponentProps<typeof UIModal.Header> &
  VariantProps<typeof modalHeaderStyle> & { className?: string };

type IModalBodyProps = React.ComponentProps<typeof UIModal.Body> &
  VariantProps<typeof modalBodyStyle> & { className?: string };

type IModalFooterProps = React.ComponentProps<typeof UIModal.Footer> &
  VariantProps<typeof modalFooterStyle> & { className?: string };

type IModalCloseButtonProps = React.ComponentProps<typeof UIModal.CloseButton> &
  VariantProps<typeof modalCloseButtonStyle> & { className?: string };

const Modal = React.forwardRef<React.ComponentRef<typeof UIModal>, IModalProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <UIModal
      ref={ref}
      {...props}
      pointerEvents="box-none"
      className={modalStyle({ size, class: className })}
      context={{ size }}
    />
  )
);

const ModalBackdrop = React.forwardRef<
  React.ComponentRef<typeof UIModal.Backdrop>,
  IModalBackdropProps
>(function ModalBackdrop({ className, ...props }, ref) {
  return (
    <UIModal.Backdrop
      ref={ref}
      entering={FadeIn.duration(200).easing(Easing.linear)}
      exiting={FadeOut.duration(200).easing(Easing.linear)}
      {...props}
      className={modalBackdropStyle({
        class: className,
      })}
    />
  );
});

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof UIModal.Content>,
  IModalContentProps
>(function ModalContent({ className, size, ...props }, ref) {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIModal.Content
      ref={ref}
      entering={ZoomIn.duration(200).withInitialValues({
        transform: [{ scale: 0.9 }],
      })}
      exiting={FadeOut.duration(200)}
      {...props}
      className={modalContentStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
      pointerEvents="auto"
    />
  );
});

const ModalHeader = React.forwardRef<
  React.ComponentRef<typeof UIModal.Header>,
  IModalHeaderProps
>(function ModalHeader({ className, ...props }, ref) {
  return (
    <UIModal.Header
      ref={ref}
      {...props}
      className={modalHeaderStyle({
        class: className,
      })}
    />
  );
});

const ModalBody = React.forwardRef<
  React.ComponentRef<typeof UIModal.Body>,
  IModalBodyProps
>(function ModalBody({ className, ...props }, ref) {
  return (
    <UIModal.Body
      ref={ref}
      {...props}
      className={modalBodyStyle({
        class: className,
      })}
    />
  );
});

const ModalFooter = React.forwardRef<
  React.ComponentRef<typeof UIModal.Footer>,
  IModalFooterProps
>(function ModalFooter({ className, ...props }, ref) {
  return (
    <UIModal.Footer
      ref={ref}
      {...props}
      className={modalFooterStyle({
        class: className,
      })}
    />
  );
});

const ModalCloseButton = React.forwardRef<
  React.ComponentRef<typeof UIModal.CloseButton>,
  IModalCloseButtonProps
>(function ModalCloseButton({ className, ...props }, ref) {
  return (
    <UIModal.CloseButton
      ref={ref}
      {...props}
      className={modalCloseButtonStyle({
        class: className,
      })}
    />
  );
});

Modal.displayName = 'Modal';
ModalBackdrop.displayName = 'ModalBackdrop';
ModalContent.displayName = 'ModalContent';
ModalHeader.displayName = 'ModalHeader';
ModalBody.displayName = 'ModalBody';
ModalFooter.displayName = 'ModalFooter';
ModalCloseButton.displayName = 'ModalCloseButton';

export {
  Modal,
  ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader
};
