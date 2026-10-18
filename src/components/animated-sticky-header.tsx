import { useEffect, useImperativeHandle, useMemo, useState, type ReactNode, type Ref } from "react";
import { Animated, Platform, type LayoutChangeEvent } from "react-native";
import {
  LinearTransition,
  useSharedValue,
  withTiming,
  type EntryOrExitLayoutType,
  type LayoutAnimationFunction,
} from "react-native-reanimated";

import { StyledAnimatedView } from "@/components/ui/utils/animated";

/** Was `ScrollView` an `StickyHeaderComponent` übergibt (Auszug, ohne `inverted`/`hiddenOnScroll`). */
interface StickyHeaderProps {
  children?: ReactNode;
  nextHeaderLayoutY?: number | null;
  onLayout: (event: LayoutChangeEvent) => void;
  scrollAnimatedValue: Animated.Value;
  ref?: Ref<{ setNextHeaderY: (y: number) => void }>;
}

interface AnimatedStickyHeaderOptions {
  /** Dauer des Gleitens – gleich wie bei den Zeilen. */
  duration: number;
  entering?: EntryOrExitLayoutType;
  exiting?: EntryOrExitLayoutType;
}

/** Bis Android/iOS den Versatz für die Berührungserkennung übernehmen (wie in React Native). */
const HIT_TEST_DEBOUNCE_MS = Platform.OS === "android" ? 15 : 64;

/**
 * Sticky-Überschrift für `ScrollView` (`StickyHeaderComponent`), die wie die Zeilen an ihre neue
 * Position gleitet (2a/3a: Abhaken, Löschen, Zuklappen).
 *
 * Der Standard von React Native legt um jede Überschrift eine eigene Hülle; ein Layout-Übergang an
 * der Überschrift selbst greift darin nie, weil sich nur die Hülle bewegt. Diese Hülle hier ist
 * selbst animiert (Reanimated) und enthält das Kleben am oberen Rand nach dem Vorbild von
 * `ScrollViewStickyHeader` (gleiche Interpolation, nur ohne `inverted`/`hiddenOnScroll`).
 * Klebt die Überschrift gerade oben, springt sie ohne Gleiten – sonst rutschte sie kurz mit dem
 * Inhalt nach unten und wieder zurück.
 */
export function createAnimatedStickyHeader({
  duration,
  entering,
  exiting,
}: AnimatedStickyHeaderOptions) {
  const linear = LinearTransition.duration(duration).build();

  function AnimatedStickyHeader({
    children,
    nextHeaderLayoutY,
    onLayout,
    scrollAnimatedValue,
    ref,
  }: StickyHeaderProps) {
    const [layout, setLayout] = useState<{ y: number; height: number } | null>(null);
    const [nextHeaderY, setNextHeaderY] = useState(nextHeaderLayoutY ?? null);
    // Fabric kennt den Versatz durch das Kleben sonst nicht – Tipps landeten auf Zeilen darunter
    const [hitTestY, setHitTestY] = useState<number | null>(null);
    const stuck = useSharedValue(false);

    // ScrollView meldet die Lage der nächsten Überschrift über die Ref (`setNextHeaderY`)
    useImperativeHandle(ref, () => ({ setNextHeaderY }), []);
    useEffect(() => {
      if (nextHeaderLayoutY != null) setNextHeaderY(nextHeaderLayoutY);
    }, [nextHeaderLayoutY]);

    const translateY = useMemo(() => {
      const inputRange = [-1, 0];
      const outputRange = [0, 0];
      if (layout) {
        // Bis zur eigenen Lage normal scrollen, dann oben kleben, bis die nächste sie wegschiebt
        inputRange.push(layout.y);
        outputRange.push(0);
        const collisionPoint = (nextHeaderY ?? 0) - layout.height;
        if (collisionPoint >= layout.y) {
          inputRange.push(collisionPoint, collisionPoint + 1);
          outputRange.push(collisionPoint - layout.y, collisionPoint - layout.y);
        } else {
          inputRange.push(layout.y + 1);
          outputRange.push(1);
        }
      }
      return scrollAnimatedValue.interpolate({ inputRange, outputRange });
    }, [scrollAnimatedValue, layout, nextHeaderY]);

    useEffect(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const id = translateY.addListener(({ value }) => {
        stuck.set(value > 0);
        clearTimeout(timer);
        timer = setTimeout(() => setHitTestY(value), HIT_TEST_DEBOUNCE_MS);
      });
      return () => {
        translateY.removeListener(id);
        clearTimeout(timer);
      };
    }, [translateY, stuck]);

    const layoutTransition: LayoutAnimationFunction = (values) => {
      "worklet";
      if (!stuck.get()) return linear(values);
      const instant = { duration: 0 };
      return {
        initialValues: {
          originX: values.targetOriginX,
          originY: values.targetOriginY,
          width: values.targetWidth,
          height: values.targetHeight,
        },
        animations: {
          originX: withTiming(values.targetOriginX, instant),
          originY: withTiming(values.targetOriginY, instant),
          width: withTiming(values.targetWidth, instant),
          height: withTiming(values.targetHeight, instant),
        },
      };
    };

    // Nicht in den Typen von Animated.View, aber von React Native selbst so genutzt
    const hitTestProps =
      hitTestY != null
        ? {
            passthroughAnimatedPropExplicitValues: {
              style: { transform: [{ translateY: hitTestY }] },
            },
          }
        : null;

    return (
      <StyledAnimatedView
        layout={layoutTransition}
        entering={entering}
        exiting={exiting}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setLayout({ y, height });
          onLayout(event);
        }}
        className="z-10"
      >
        <Animated.View
          collapsable={false}
          style={{ transform: [{ translateY }] }}
          {...(hitTestProps as object)}
        >
          {children}
        </Animated.View>
      </StyledAnimatedView>
    );
  }

  return AnimatedStickyHeader;
}
