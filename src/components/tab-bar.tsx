import type { TabTriggerSlotProps } from "expo-router/ui";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import {
  Easing,
  interpolate,
  makeMutable,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/**
 * Icon-Animation beim Aktivieren – VORLÄUFIG vier Varianten zum Vergleich, je Tab eine
 * (Branch `ui-feinschliff`); danach bleibt eine für alle Tabs.
 * - `expand`: Icon federt kurz ein und aus
 * - `pop`: Icon hüpft nach oben
 * - `wiggle`: Icon wackelt
 * - `rise`: Icon gleitet von unten herein
 */
export type TabAnimation = "expand" | "pop" | "wiggle" | "rise";

/** Pille 56 × 30 (`h-7.5 w-14`). */
const PILL_WIDTH = 56;
const PILL_HEIGHT = 30;

const KICK = { duration: 460, easing: Easing.out(Easing.quad) };
/** Die vordere Kante der Pille läuft voraus, die hintere zieht nach – die Pille dehnt sich kurz. */
const LEADING_EDGE = { damping: 22, stiffness: 340, mass: 0.7 };
const TRAILING_EDGE = { damping: 20, stiffness: 160, mass: 0.8 };

/**
 * Eine gemeinsame Pille für die ganze Tab-Leiste (es gibt nur eine): linke und rechte Kante,
 * gemessen in der Tab-Leiste. `-1` = noch nicht gemessen.
 */
const pillLeft = makeMutable(-1);
const pillRight = makeMutable(-1);

function movePill(left: number, animate: boolean) {
  const right = left + PILL_WIDTH;
  if (!animate || pillLeft.value < 0) {
    pillLeft.value = left;
    pillRight.value = right;
    return;
  }
  const forward = left > pillLeft.value;
  pillLeft.value = withSpring(left, forward ? TRAILING_EDGE : LEADING_EDGE);
  pillRight.value = withSpring(right, forward ? LEADING_EDGE : TRAILING_EDGE);
}

/**
 * Gleitende Pille (Komponenten 10a: aktiv = Pille auf `chip`). Liegt als erstes Kind in der
 * Tab-Leiste, hinter den Buttons; `top-2` entspricht dem `pt-2` der Leiste.
 */
export function TabBarPill() {
  const style = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillRight.value - pillLeft.value,
    opacity: pillLeft.value < 0 ? 0 : 1,
    // Rundung per Style statt `rounded-[999px]`: die Klasse griff hier auf dem Gerät nicht
    borderRadius: PILL_HEIGHT / 2,
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0">
      <StyledAnimatedView className="absolute top-2 h-7.5 bg-chip" style={style} />
    </View>
  );
}

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: LucideIcon;
  animation: TabAnimation;
};

/**
 * Eintrag der Tab-Leiste (TabBar, Komponenten 10a). Aktiv: Icon und Text in `primary`, die
 * Pille gleitet herüber; sonst `soft`. Wird von `TabTrigger asChild` mit `isFocused`, `onPress`
 * usw. versorgt.
 */
export function TabBarButton({
  label,
  icon,
  animation,
  isFocused,
  style,
  ref,
  onLayout,
  ...props
}: TabBarButtonProps) {
  const focused = isFocused === true;
  /** Linke Kante der Pille, wenn dieser Tab aktiv ist (mittig über dem Icon). */
  const pillX = useRef<number | null>(null);
  /** Einmaliger Ablauf 0 → 1 beim Aktivieren – treibt das Icon. */
  const kick = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    // Beim ersten Rendern steht alles schon an Ort und Stelle (kein Animieren beim App-Start)
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!focused) return;
    if (pillX.current !== null) movePill(pillX.current, true);
    kick.value = 0;
    kick.value = withTiming(1, KICK);
  }, [focused, kick]);

  const iconStyle = useAnimatedStyle(() => {
    const k = kick.value;
    switch (animation) {
      case "expand":
        return { transform: [{ scale: interpolate(k, [0, 0.3, 0.65, 1], [1, 0.82, 1.12, 1]) }] };
      case "pop":
        return {
          transform: [
            { translateY: interpolate(k, [0, 0.35, 1], [0, -5, 0]) },
            { scale: interpolate(k, [0, 0.35, 1], [1, 1.1, 1]) },
          ],
        };
      case "wiggle":
        return {
          transform: [
            { rotate: `${interpolate(k, [0, 0.2, 0.45, 0.7, 1], [0, -14, 10, -5, 0])}deg` },
          ],
        };
      case "rise":
        return { transform: [{ translateY: interpolate(k, [0, 1], [6, 0]) }] };
    }
  });

  return (
    <Pressable
      ref={ref}
      role="tab"
      aria-selected={focused}
      aria-label={label}
      className="min-h-13 flex-1 flex-col items-center gap-1"
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        pillX.current = x + (width - PILL_WIDTH) / 2;
        // Beim Start und bei Größenänderung ohne Animation an den aktiven Tab setzen
        if (focused) movePill(pillX.current, false);
        onLayout?.(event);
      }}
      {...props}
    >
      <View className="h-7.5 w-14 items-center justify-center">
        <StyledAnimatedView style={iconStyle}>
          <Icon as={icon} size="lg" className={cn(focused ? "text-primary" : "text-soft")} />
        </StyledAnimatedView>
      </View>
      <Text
        numberOfLines={1}
        className={cn("text-xs", focused ? "font-extrabold text-primary" : "font-bold text-soft")}
      >
        {label}
      </Text>
    </Pressable>
  );
}
