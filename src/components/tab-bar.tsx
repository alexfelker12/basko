import type { TabTriggerSlotProps } from "expo-router/ui";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable } from "react-native";
import {
  Easing,
  interpolate,
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
 * Animation der aktiven Pille – VORLÄUFIG vier Varianten zum Vergleich, je Tab eine
 * (Branch `ui-feinschliff`); danach bleibt eine für alle Tabs.
 * - `expand`: Pille wächst aus der Mitte in die Breite, Icon federt kurz ein und aus
 * - `pop`: Pille ploppt rundum auf (mit Überschwingen), Icon hüpft nach oben
 * - `wiggle`: Pille blendet mit leichtem Zoom ein, Icon wackelt
 * - `rise`: Pille und Icon gleiten von unten herein
 */
export type TabAnimation = "expand" | "pop" | "wiggle" | "rise";

/** Pille 56 × 30 (`h-7.5 w-14`). */
const PILL_HEIGHT = 30;

const ENTER_SPRING = { damping: 16, stiffness: 260, mass: 0.8 };
const POP_SPRING = { damping: 9, stiffness: 240, mass: 0.7 };
const EXIT = { duration: 140 };
const KICK = { duration: 460, easing: Easing.out(Easing.quad) };

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: LucideIcon;
  animation: TabAnimation;
};

/**
 * Eintrag der Tab-Leiste (TabBar, Komponenten 10a).
 * Aktiv: Pille 56 × 30 in `chip`, Icon und Text in `primary`; sonst `soft`.
 * Wird von `TabTrigger asChild` mit `isFocused`, `onPress` usw. versorgt.
 */
export function TabBarButton({
  label,
  icon,
  animation,
  isFocused,
  style,
  ref,
  ...props
}: TabBarButtonProps) {
  const focused = isFocused === true;
  /** 0 = inaktiv, 1 = aktiv – treibt die Pille. */
  const progress = useSharedValue(focused ? 1 : 0);
  /** Einmaliger Ablauf 0 → 1 beim Aktivieren – treibt das Icon. */
  const kick = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    // Beim ersten Rendern steht alles schon an Ort und Stelle (kein Animieren beim App-Start)
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!focused) {
      progress.value = withTiming(0, EXIT);
      return;
    }
    progress.value = withSpring(1, animation === "pop" ? POP_SPRING : ENTER_SPRING);
    kick.value = 0;
    kick.value = withTiming(1, KICK);
  }, [focused, animation, progress, kick]);

  const pillStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // Rundung per Style statt `rounded-[999px]`: die Klasse griff hier auf dem Gerät nicht
    const base = { opacity: Math.min(1, Math.max(0, p)), borderRadius: PILL_HEIGHT / 2 };
    switch (animation) {
      case "expand":
        return { ...base, transform: [{ scaleX: interpolate(p, [0, 1], [0.3, 1]) }] };
      case "pop":
        return { ...base, transform: [{ scale: interpolate(p, [0, 1], [0.4, 1]) }] };
      case "wiggle":
        return { ...base, transform: [{ scale: interpolate(p, [0, 1], [0.85, 1]) }] };
      case "rise":
        return { ...base, transform: [{ translateY: interpolate(p, [0, 1], [8, 0]) }] };
    }
  });

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
      {...props}
    >
      <StyledAnimatedView className="h-7.5 w-14 items-center justify-center">
        <StyledAnimatedView className="absolute inset-0 bg-chip" style={pillStyle} />
        <StyledAnimatedView style={iconStyle}>
          <Icon as={icon} size="lg" className={cn(focused ? "text-primary" : "text-soft")} />
        </StyledAnimatedView>
      </StyledAnimatedView>
      <Text
        numberOfLines={1}
        className={cn("text-xs", focused ? "font-extrabold text-primary" : "font-bold text-soft")}
      >
        {label}
      </Text>
    </Pressable>
  );
}
