import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useKeyboardHeight } from "@/hooks/use-keyboard";

/** Platzhalter in Höhe der Tastatur – hebt Dialoge über die Tastatur, gibt Listen Platz zum Scrollen. */
export function KeyboardSpacer() {
  const { height } = useKeyboardHeight();
  const style = useAnimatedStyle(() => ({ height: Math.max(0, -height.get()) }));
  return <Animated.View style={style} />;
}
