import type { ComponentType, ReactNode, Ref } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { styled } from 'nativewind';
import Animated, {
  type EntryOrExitLayoutType,
  type LayoutAnimationFunction,
  type ILayoutAnimationBuilder,
  type useAnimatedStyle,
} from 'react-native-reanimated';

/**
 * Basko: Reanimated-Komponenten mit schlanken Prop-Typen.
 *
 * `styled()` aus NativeWind über `Animated.createAnimatedComponent(...)` lässt den
 * TypeScript-Check praktisch hängen (Typen von `AnimatedProps`, Reanimated 4.5).
 * Die gluestack-Komponenten brauchen nur `entering`/`exiting`, daher reicht dieser Typ.
 */
export type LayoutAnimationProps = {
  entering?: EntryOrExitLayoutType;
  exiting?: EntryOrExitLayoutType;
  /** Layout-Übergang, z. B. `LinearTransition` – Einträge gleiten an ihre neue Position. */
  layout?: ILayoutAnimationBuilder | LayoutAnimationFunction;
};

/** Statischer Style oder Ergebnis von `useAnimatedStyle`. */
type AnimatedViewStyle = StyleProp<ViewStyle> | ReturnType<typeof useAnimatedStyle>;

type AnimatedViewProps = Omit<ViewProps, 'style'> &
  LayoutAnimationProps & { style?: AnimatedViewStyle; ref?: Ref<View> };

export const AnimatedView = Animated.createAnimatedComponent(
  View
) as unknown as ComponentType<AnimatedViewProps>;

// `style`/`children` ohne Funktions-Varianten von Pressable – sonst wird der Typ für styled() zu komplex.
type AnimatedPressableProps = Omit<PressableProps, 'style' | 'children'> &
  LayoutAnimationProps & {
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    ref?: Ref<View>;
  };

export const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable
) as unknown as ComponentType<AnimatedPressableProps>;

type WithClassName<P> = P & { className?: string };

/** Mit `className` (NativeWind) – explizit typisiert, damit styled() nicht inferieren muss. */
export const StyledAnimatedView = styled(AnimatedView as ComponentType<any>, {
  className: 'style',
}) as ComponentType<WithClassName<AnimatedViewProps>>;

export const StyledAnimatedPressable = styled(AnimatedPressable as ComponentType<any>, {
  className: 'style',
}) as ComponentType<WithClassName<AnimatedPressableProps>>;
