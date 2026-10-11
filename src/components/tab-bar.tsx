import type { TabTriggerSlotProps } from "expo-router/ui";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import {
  Easing,
  makeMutable,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";

/** Pille 56 × 30 (`h-7.5 w-14`). */
const PILL_WIDTH = 56;
const PILL_HEIGHT = 30;

const SLIDE = { duration: 280, easing: Easing.inOut(Easing.cubic) };

/**
 * Eine gemeinsame Pille für die ganze Tab-Leiste (es gibt nur eine): linke Kante, gemessen in der
 * Tab-Leiste. `-1` = noch nicht gemessen.
 */
const pillLeft = makeMutable(-1);

function movePill(left: number, animate: boolean) {
  pillLeft.value = animate && pillLeft.value >= 0 ? withTiming(left, SLIDE) : left;
}

/**
 * Gleitende Pille (Komponenten 10a: aktiv = Pille auf `chip`). Liegt als erstes Kind in der
 * Tab-Leiste, hinter den Buttons; `top-2` entspricht dem `pt-2` der Leiste.
 */
export function TabBarPill() {
  const style = useAnimatedStyle(() => ({
    opacity: pillLeft.value < 0 ? 0 : 1,
    transform: [{ translateX: pillLeft.value }],
    // Rundung per Style statt `rounded-[999px]`: die Klasse griff hier auf dem Gerät nicht
    borderRadius: PILL_HEIGHT / 2,
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0">
      <StyledAnimatedView className="absolute left-0 top-2 h-7.5 w-14 bg-chip" style={style} />
    </View>
  );
}

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: LucideIcon;
};

/**
 * Eintrag der Tab-Leiste (TabBar, Komponenten 10a). Aktiv: Icon und Text in `primary`, die
 * Pille gleitet herüber und die Farben blenden mit ihr über; sonst `soft`.
 * Wird von `TabTrigger asChild` mit `isFocused`, `onPress` usw. versorgt.
 */
export function TabBarButton({
  label,
  icon,
  isFocused,
  style,
  ref,
  onLayout,
  ...props
}: TabBarButtonProps) {
  const focused = isFocused === true;
  /** Linke Kante der Pille, wenn dieser Tab aktiv ist (mittig über dem Icon). */
  const pillX = useRef<number | null>(null);
  /** Dasselbe für den UI-Thread, dazu die Breite des Tabs – für den Farbverlauf. */
  const ownLeft = useSharedValue(-1);
  const ownWidth = useSharedValue(1);

  // Beim Wechsel gleitet die Pille herüber; beim Start setzt sie `onLayout` ohne Animation
  useEffect(() => {
    if (focused && pillX.current !== null) movePill(pillX.current, true);
  }, [focused]);

  /**
   * Wie weit die Pille über diesem Tab steht (0–1): Icon und Text blenden im Gleichlauf mit der
   * Pille von `soft` zu `primary` über – ein gleichmäßiger Verlauf statt eines harten Wechsels.
   */
  const activeStyle = useAnimatedStyle(() => {
    if (pillLeft.value < 0 || ownLeft.value < 0) return { opacity: focused ? 1 : 0 };
    const distance = Math.abs(pillLeft.value - ownLeft.value) / ownWidth.value;
    return { opacity: Math.min(1, Math.max(0, 1 - distance)) };
  });
  const inactiveStyle = useAnimatedStyle(() => {
    if (pillLeft.value < 0 || ownLeft.value < 0) return { opacity: focused ? 0 : 1 };
    const distance = Math.abs(pillLeft.value - ownLeft.value) / ownWidth.value;
    return { opacity: Math.min(1, Math.max(0, distance)) };
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
        ownLeft.value = pillX.current;
        ownWidth.value = width;
        // Beim Start und bei Größenänderung ohne Animation an den aktiven Tab setzen
        if (focused) movePill(pillX.current, false);
        onLayout?.(event);
      }}
      {...props}
    >
      <View className="h-7.5 w-14 items-center justify-center">
        <StyledAnimatedView style={inactiveStyle}>
          <Icon as={icon} size="lg" className="text-soft" />
        </StyledAnimatedView>
        <StyledAnimatedView
          className="absolute inset-0 items-center justify-center"
          style={activeStyle}
        >
          <Icon as={icon} size="lg" className="text-primary" />
        </StyledAnimatedView>
      </View>
      <View className="items-center">
        <StyledAnimatedView style={inactiveStyle}>
          <Text numberOfLines={1} className="text-xs font-bold text-soft">
            {label}
          </Text>
        </StyledAnimatedView>
        {/* Breiter als der Platzhalter: der fette Text darf etwas überstehen */}
        <StyledAnimatedView className="absolute -inset-x-3 items-center" style={activeStyle}>
          <Text numberOfLines={1} className="text-xs font-extrabold text-primary">
            {label}
          </Text>
        </StyledAnimatedView>
      </View>
    </Pressable>
  );
}
