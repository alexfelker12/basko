import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";

/** Platzhalter in Höhe der Tastatur – hebt Sheet-Inhalte über die Tastatur. */
export function KeyboardSpacer() {
  const { height } = useReanimatedKeyboardAnimation();
  const style = useAnimatedStyle(() => ({ height: Math.max(0, -height.get()) }));
  return <Animated.View style={style} />;
}
