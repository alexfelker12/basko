'use client';
// Basko: gluestack BottomSheet (@gorhom/bottom-sheet), Klassen auf unsere Tokens umgestellt.
// Im App-Code über `src/components/sheet.tsx` verwenden (gesteuert per `isOpen`).
import { FocusScope } from '@gluestack-ui/utils/aria';
import { cn, tva } from '@gluestack-ui/utils/nativewind-utils';
import { Overlay } from '@gluestack-ui/core/overlay/creator';
import GorhomBottomSheet, {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetFlatList as GorhomBottomSheetFlatList,
  BottomSheetFooter as GorhomBottomSheetFooter,
  BottomSheetHandle as GorhomBottomSheetHandle,
  BottomSheetTextInput as GorhomBottomSheetInput,
  BottomSheetScrollView as GorhomBottomSheetScrollView,
  BottomSheetSectionList as GorhomBottomSheetSectionList,
  BottomSheetView as GorhomBottomSheetView,
} from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PressableProps, TextInputProps, TextProps } from 'react-native';
import { Keyboard, Platform, Text, View } from 'react-native';
import { Pressable as RNPressable } from 'react-native';
import { Pressable as GGHPressable } from 'react-native-gesture-handler';

const bottomSheetBackdropStyle = tva({
  base: 'absolute inset-0 bg-black opacity-50',
});

const bottomSheetContentStyle = tva({
  base: '',
});

const bottomSheetTriggerStyle = tva({
  base: 'rounded-card border border-line p-4',
});

const bottomSheetHandleStyle = tva({
  base: 'w-full items-center rounded-t-card pb-1.5 pt-2.5',
});

const bottomSheetItemStyle = tva({
  base: 'min-h-12 w-full flex-row items-center gap-2.5 px-page disabled:opacity-40 active:bg-chip data-[focus=true]:bg-chip web:pointer-events-auto disabled:cursor-not-allowed',
});
const bottomSheetItemTextStyle = tva({
  base: 'font-sans text-base font-bold text-ink',
});

const bottomSheetFooterStyle = tva({
  base: 'border-t border-line px-page py-2.5',
});

const bottomSheetTextInputStyle = tva({
  base: 'h-12 w-full rounded-card border border-line bg-surface px-3.5 font-sans text-base font-semibold text-ink placeholder:text-soft web:outline-none',
});

type BottomSheetContextValue = {
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  handleClose: () => void;
  handleOpen: (index?: number) => void;
  isVisible: boolean;
  handleSheetChanges: (index: number) => void;
  currentIndex: number;
};

const BottomSheetContext = createContext<BottomSheetContextValue>({
  bottomSheetRef: { current: null },
  handleClose: () => { },
  handleOpen: () => { },
  isVisible: false,
  handleSheetChanges: () => { },
  currentIndex: -1,
});

export type BottomSheetRef = {
  open: (index?: number) => void;
  close: () => void;
  snapToIndex: (index: number) => void;
  expand: () => void;
  collapse: () => void;
};

type IBottomSheetRootProps = {
  defaultSnapIndex?: number;
  children?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  onChange?: (index: number) => void;
};

export const BottomSheet = forwardRef<BottomSheetRef, IBottomSheetRootProps>(
  ({ defaultSnapIndex = 0, onOpen, onClose, onChange, children }, ref) => {
    const bottomSheetRef = useRef<GorhomBottomSheet>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const handleOpen = useCallback(
      (index?: number) => {
        const targetIndex = index ?? defaultSnapIndex;
        setCurrentIndex(targetIndex);
        setIsVisible(true);
        onOpen?.();
      },
      [defaultSnapIndex, onOpen]
    );

    const handleClose = useCallback(() => {
      Keyboard.dismiss();
      setCurrentIndex(-1);
    }, []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        setCurrentIndex(index);
        onChange?.(index);
        if (index === -1) {
          setIsVisible(false);
          onClose?.();
        } else {
          setIsVisible(true);
        }
      },
      [onClose, onChange]
    );

    const snapToIndex = useCallback((index: number) => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.snapToIndex(index);
      } else {
        setCurrentIndex(index);
        setIsVisible(true);
      }
    }, []);

    const expand = useCallback(() => {
      bottomSheetRef.current?.expand();
    }, []);

    const collapse = useCallback(() => {
      bottomSheetRef.current?.collapse();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
        close: handleClose,
        snapToIndex,
        expand,
        collapse,
      }),
      [handleOpen, handleClose, snapToIndex, expand, collapse]
    );

    const contextValue = useMemo(
      () => ({
        bottomSheetRef,
        handleClose,
        handleOpen,
        isVisible,
        handleSheetChanges,
        currentIndex,
      }),
      [handleClose, handleOpen, isVisible, handleSheetChanges, currentIndex]
    );

    return (
      <BottomSheetContext.Provider value={contextValue}>
        {children}
      </BottomSheetContext.Provider>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const StyledGorhomBottomSheet = styled(GorhomBottomSheet, {
  className: 'style',
  backgroundClassName: 'backgroundStyle',
  handleIndicatorClassName: 'handleIndicatorStyle',
});

type IBottomSheetPortalProps = Omit<
  React.ComponentProps<typeof GorhomBottomSheet>,
  'ref' | 'index'
> & {
  className?: string;
  backgroundClassName?: string;
  handleIndicatorClassName?: string;
};

export const BottomSheetPortal = ({
  className,
  backgroundClassName,
  handleIndicatorClassName,
  enablePanDownToClose = true,
  enableDynamicSizing = false,
  snapPoints,
  onChange,
  ...props
}: IBottomSheetPortalProps) => {
  const { bottomSheetRef, handleSheetChanges, isVisible, currentIndex } =
    useContext(BottomSheetContext);

  // Basko: ohne useMemo – der React Compiler memoisiert; Aufrufer übergeben stabile Arrays.
  const memoizedSnapPoints = snapPoints;

  if (!isVisible) return null;

  // Defensive index check to prevent Invariant Violation
  const snapPointList = Array.isArray(memoizedSnapPoints) ? memoizedSnapPoints : undefined;
  const validIndex =
    snapPointList && snapPointList.length > 0
      ? Math.min(currentIndex, snapPointList.length - 1)
      : currentIndex;

  return (
    <Overlay isOpen={true} isKeyboardDismissable={false} style={{ flex: 1 }}>
      <StyledGorhomBottomSheet
        ref={bottomSheetRef}
        snapPoints={memoizedSnapPoints}
        index={validIndex}
        enableDynamicSizing={enableDynamicSizing}
        onChange={(idx, position, type) => {
          handleSheetChanges(idx);
          onChange?.(idx, position, type);
        }}
        enablePanDownToClose={enablePanDownToClose}
        // @ts-ignore
        className={className}
        // @ts-ignore
        backgroundClassName={cn('rounded-t-card bg-surface', backgroundClassName)}
        // @ts-ignore
        handleIndicatorClassName={cn('h-1 w-9 bg-soft/45', handleIndicatorClassName)}
        {...props}
      >
        {props.children}
      </StyledGorhomBottomSheet>
    </Overlay>
  );
};

export const BottomSheetTrigger = ({
  className,
  index,
  onPress,
  ...props
}: PressableProps & { className?: string; index?: number }) => {
  const { handleOpen } = useContext(BottomSheetContext);
  return (
    <RNPressable
      {...props}
      onPress={(e) => {
        onPress?.(e);
        handleOpen(index);
      }}
      className={bottomSheetTriggerStyle({ className })}
    >
      {props.children}
    </RNPressable>
  );
};

type IBottomSheetBackdropProps = React.ComponentProps<typeof GorhomBottomSheetBackdrop> & {
  className?: string;
};

export const BottomSheetBackdrop = ({
  disappearsOnIndex = -1,
  appearsOnIndex = 0,
  opacity = 0.5,
  className,
  pressBehavior = 'close',
  ...props
}: IBottomSheetBackdropProps) => {
  return (
    <GorhomBottomSheetBackdrop
      // @ts-ignore
      className={bottomSheetBackdropStyle({ className })}
      disappearsOnIndex={disappearsOnIndex}
      appearsOnIndex={appearsOnIndex}
      opacity={opacity}
      pressBehavior={pressBehavior}
      {...props}
    />
  );
};

const StyledGorhomBottomSheetHandle = styled(GorhomBottomSheetHandle, {
  className: 'style',
});

type IBottomSheetHandleProps = React.ComponentProps<
  typeof GorhomBottomSheetHandle
> & {
  className?: string;
  indicatorClassName?: string;
};

export const BottomSheetDragIndicator = ({
  children,
  className,
  indicatorClassName,
  ...props
}: IBottomSheetHandleProps) => {
  return (
    <StyledGorhomBottomSheetHandle
      {...props}
      // @ts-ignore
      className={bottomSheetHandleStyle({ className })}
    >
      {children}
    </StyledGorhomBottomSheetHandle>
  );
};

const StyledGorhomBottomSheetView = styled(GorhomBottomSheetView, {
  className: 'style',
});

type IBottomSheetContentProps = React.ComponentProps<
  typeof GorhomBottomSheetView
> & {
  className?: string;
  focusScope?: boolean;
};

export const BottomSheetContent = ({
  className,
  focusScope = true,
  ...props
}: IBottomSheetContentProps) => {
  const { handleClose, isVisible } = useContext(BottomSheetContext);

  const keyDownHandlers = useMemo(() => {
    if (Platform.OS !== 'web') return {};
    return {
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
      },
    };
  }, [handleClose]);

  const content = props.children;
  const wrappedContent =
    Platform.OS === 'web' && isVisible && focusScope ? (
      <FocusScope contain={isVisible} autoFocus restoreFocus>
        {content}
      </FocusScope>
    ) : (
      content
    );

  return (
    <StyledGorhomBottomSheetView
      {...props}
      // @ts-ignore
      {...keyDownHandlers}
      // @ts-ignore
      className={bottomSheetContentStyle({ className })}
    >
      {wrappedContent}
    </StyledGorhomBottomSheetView>
  );
};

type IBottomSheetFooterProps = React.ComponentProps<
  typeof GorhomBottomSheetFooter
> & {
  className?: string;
  children?: React.ReactNode;
};

export const BottomSheetFooter = ({
  className,
  children,
  ...props
}: IBottomSheetFooterProps) => {
  return (
    <GorhomBottomSheetFooter {...props}>
      <View
        // @ts-ignore
        className={bottomSheetFooterStyle({ className })}
      >
        {children}
      </View>
    </GorhomBottomSheetFooter>
  );
};

type IBottomSheetItemProps = PressableProps & {
  className?: string;
  closeOnSelect?: boolean;
};

const StyledGGHPressable = styled(GGHPressable as React.ComponentType<PressableProps>, {
  className: 'style',
});

export const BottomSheetItem = ({
  children,
  className,
  closeOnSelect = true,
  ...props
}: IBottomSheetItemProps) => {
  const { handleClose } = useContext(BottomSheetContext);

  const Pressable = Platform.OS === 'web' ? RNPressable : StyledGGHPressable;

  return (
    <Pressable
      {...props}
      // @ts-ignore
      className={bottomSheetItemStyle({ className })}
      onPress={(e) => {
        props.onPress?.(e);
        if (closeOnSelect) {
          handleClose();
        }
      }}
      role="button"
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
};

type IBottomSheetItemTextProps = TextProps & {
  className?: string;
};

export const BottomSheetItemText = ({
  className,
  ...props
}: IBottomSheetItemTextProps) => {
  return (
    <Text {...props} className={bottomSheetItemTextStyle({ className })} />
  );
};

const StyledGorhomBottomSheetInput = styled(GorhomBottomSheetInput, {
  className: 'style',
});

export const BottomSheetTextInput = ({
  className,
  ...props
}: TextInputProps) => {
  return (
    <StyledGorhomBottomSheetInput
      {...props}
      // @ts-ignore
      className={bottomSheetTextInputStyle({ className })}
    />
  );
};

// Scrollable components
export const BottomSheetScrollView = GorhomBottomSheetScrollView;
export const BottomSheetFlatList = GorhomBottomSheetFlatList;
export const BottomSheetSectionList = GorhomBottomSheetSectionList;
