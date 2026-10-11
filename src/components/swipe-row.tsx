import type { LucideIcon } from "lucide-react-native";
import { useEffect, useId, type ReactNode } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { hapticTap } from "@/lib/haptics";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Breite der freigelegten Aktion: Löschen 96, Bearbeiten 112 (Komponenten → SwipeRow). */
export const SWIPE_ACTION_WIDTH = { delete: 96, edit: 112 } as const;
/** Ab diesem Anteil der Zeilenbreite gilt ein Wisch als „voll“ und löst sofort aus. */
const FULL_SWIPE_RATIO = 0.55;
const ANIMATION = { duration: 180 };

/**
 * Immer nur eine Zeile offen: die zuletzt geöffnete schließt sich, sobald eine andere wischt.
 * Zeilen werden über ihre ID verwaltet – Shared Values verlieren beim Wechsel vom UI- in den
 * JS-Thread (scheduleOnRN) ihre Methoden.
 */
const rowClosers = new Map<string, () => void>();
let openRowId: string | null = null;

function claimOpenRow(rowId: string) {
  if (openRowId !== null && openRowId !== rowId) rowClosers.get(openRowId)?.();
  openRowId = rowId;
}

interface SwipeRowProps {
  label: string;
  icon: LucideIcon;
  tone: "danger" | "primary";
  actionWidth: number;
  onAction: () => void;
  /** Voller Wisch schiebt die Zeile hinaus (Löschen), sonst federt sie zurück (Bearbeiten). */
  slideOutOnFullSwipe?: boolean;
  enabled?: boolean;
  children: ReactNode;
}

/**
 * SwipeRow (eigen, Gesture Handler + Reanimated): Wischen nach links legt die Aktion frei,
 * ein voller Wisch löst sie sofort aus (Spezifikation → Globale Muster → Wisch-Zeilen).
 */
export function SwipeRow({
  label,
  icon,
  tone,
  actionWidth,
  onAction,
  slideOutOnFullSwipe = false,
  enabled = true,
  children,
}: SwipeRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const pastFullSwipe = useSharedValue(false);

  const rowId = useId();

  useEffect(() => {
    rowClosers.set(rowId, () => translateX.set(withTiming(0, ANIMATION)));
    return () => {
      rowClosers.delete(rowId);
      if (openRowId === rowId) openRowId = null;
    };
  }, [rowId, translateX]);

  const trigger = () => {
    hapticTap();
    onAction();
  };

  const finish = (slideOut: boolean) => {
    "worklet";
    if (slideOut) {
      translateX.set(
        withTiming(-rowWidth.get(), ANIMATION, (finished) => {
          if (finished) scheduleOnRN(trigger);
        })
      );
    } else {
      translateX.set(withTiming(0, ANIMATION));
      scheduleOnRN(trigger);
    }
  };

  /** Tipp auf die freigelegte Aktion (läuft im JS-Thread). */
  const onActionPress = () => {
    if (slideOutOnFullSwipe) {
      translateX.set(
        withTiming(-rowWidth.get(), ANIMATION, (finished) => {
          if (finished) scheduleOnRN(trigger);
        })
      );
    } else {
      translateX.set(withTiming(0, ANIMATION));
      trigger();
    }
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.set(translateX.get());
      scheduleOnRN(claimOpenRow, rowId);
    })
    .onUpdate((event) => {
      const next = Math.min(0, startX.get() + event.translationX);
      translateX.set(next);
      const full = -next > rowWidth.get() * FULL_SWIPE_RATIO;
      if (full !== pastFullSwipe.get()) {
        pastFullSwipe.set(full);
        scheduleOnRN(hapticTap);
      }
    })
    .onEnd((event) => {
      const offset = -translateX.get();
      pastFullSwipe.set(false);

      if (offset > rowWidth.get() * FULL_SWIPE_RATIO) {
        finish(slideOutOnFullSwipe);
      } else if (offset > actionWidth / 2 || event.velocityX < -600) {
        translateX.set(withTiming(-actionWidth, ANIMATION));
      } else {
        translateX.set(withTiming(0, ANIMATION));
      }
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.get() }] }));
  const actionStyle = useAnimatedStyle(() => ({
    width: Math.max(actionWidth, -translateX.get()),
    // Erst sichtbar, wenn die Zeile verschoben ist – sonst blitzt die Aktion beim Einblenden auf
    opacity: translateX.get() < 0 ? 1 : 0,
  }));

  const onLayout = (event: LayoutChangeEvent) => rowWidth.set(event.nativeEvent.layout.width);
  const textClass = tone === "danger" ? "text-white" : "text-primary-ink";

  return (
    <View onLayout={onLayout} className="overflow-hidden">
      <StyledAnimatedView style={actionStyle} className="absolute bottom-0 right-0 top-0">
        <Pressable
          onPress={onActionPress}
          role="button"
          aria-label={label}
          className={cn(
            "flex-1 items-center justify-center gap-1",
            tone === "danger" ? "bg-danger" : "bg-primary"
          )}
        >
          <Icon as={icon} size="md" className={textClass} />
          <Text className={cn("text-xs font-bold", textClass)}>{label}</Text>
        </Pressable>
      </StyledAnimatedView>

      <GestureDetector gesture={pan}>
        <StyledAnimatedView style={rowStyle} className="bg-bg">
          {children}
        </StyledAnimatedView>
      </GestureDetector>
    </View>
  );
}
