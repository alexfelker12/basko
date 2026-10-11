import type { ReactNode } from "react";
import { useAnimatedStyle } from "react-native-reanimated";

import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useKeyboardHeight } from "@/hooks/use-keyboard";

interface KeyboardStickyProps {
  /**
   * Abstand zwischen der Unterkante dieser Ansicht und dem Bildschirmrand, z. B. die Tab-Leiste.
   * Um so viel weniger wird angehoben, damit die Ansicht genau auf der Tastatur sitzt.
   */
  bottomGap?: number;
  className?: string;
  children: ReactNode;
}

/** Hält eine Leiste unten fest über der Tastatur (Suchleisten 3a, 4a). */
export function KeyboardSticky({ bottomGap = 0, className, children }: KeyboardStickyProps) {
  const { height } = useKeyboardHeight();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(0, height.get() + bottomGap) }],
  }));

  return (
    <StyledAnimatedView style={style} className={className}>
      {children}
    </StyledAnimatedView>
  );
}
