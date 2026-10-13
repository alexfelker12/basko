import type { LucideIcon } from "lucide-react-native";
import { useRef, type ReactNode } from "react";
import { View } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useKeyboardHeight } from "@/hooks/use-keyboard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  /**
   * Bei offener Tastatur mittig zwischen Oberkante und Tastatur statt in der ganzen Fläche –
   * für Screens mit Suchfeld darüber (7a). Ohne Tastatur bleibt der Inhalt in der Mitte.
   */
  avoidKeyboard?: boolean;
  /** Optionaler Knopf darunter. */
  children?: ReactNode;
}

/** EmptyState (Komponenten): 88er Kreis mit Icon, Titel, Text – mittig in der freien Fläche. */
export function EmptyState({
  icon,
  title,
  text,
  avoidKeyboard = false,
  children,
}: EmptyStateProps) {
  const containerRef = useRef<View>(null);
  const frame = useSafeAreaFrame();
  const { height: keyboardHeight } = useKeyboardHeight();
  /** Abstand Unterkante der Fläche → Bildschirmrand (z. B. Tab-Leiste + Navigationsleiste). */
  const bottomGap = useSharedValue(0);

  // Die Tastatur verdeckt `overlap` vom unteren Teil der Fläche: um die Hälfte davon anheben,
  // dann steht der Inhalt mittig im sichtbaren Rest. Die Höhe ist ≤ 0 (= −Tastaturhöhe).
  const style = useAnimatedStyle(() => {
    if (!avoidKeyboard) return { transform: [{ translateY: 0 }] };
    const overlap = -keyboardHeight.get() - bottomGap.get();
    return { transform: [{ translateY: overlap > 0 ? -overlap / 2 : 0 }] };
  });

  const measure = () => {
    if (!avoidKeyboard) return;
    containerRef.current?.measureInWindow((_x, y, _width, height) => {
      bottomGap.set(Math.max(0, frame.height - (y + height)));
    });
  };

  return (
    <View ref={containerRef} onLayout={measure} className="flex-1 justify-center px-10">
      <StyledAnimatedView style={style} className="items-center gap-2">
        <View className="mb-2 size-22 items-center justify-center rounded-[999px] bg-chip">
          <Icon as={icon} className="h-9 w-9 text-soft" />
        </View>
        <Text className="text-center text-lg font-extrabold">{title}</Text>
        {text ? <Text className="text-center text-sm text-soft">{text}</Text> : null}
        {children ? <View className="mt-4">{children}</View> : null}
      </StyledAnimatedView>
    </View>
  );
}
