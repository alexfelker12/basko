import * as Haptics from "expo-haptics";

/**
 * Kurze Vibration (Spezifikation → Globale Muster → Haptik):
 * langer Druck, Wischaktionen, Abhaken, Anheben einer Kategorie.
 */
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
