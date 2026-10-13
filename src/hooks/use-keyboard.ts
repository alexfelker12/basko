import { useEffect, useRef } from "react";
import { Keyboard, TextInput } from "react-native";
import { useKeyboardContext } from "react-native-keyboard-controller";

/**
 * Tastaturhöhe (`height`, ≤ 0 = −Tastaturhöhe) und `progress` als Shared Values.
 *
 * Bewusst über den Kontext statt `useReanimatedKeyboardAnimation`/`KeyboardStickyView`/
 * `KeyboardAwareScrollView`: Diese Hooks schalten Android beim Einhängen auf `adjustResize` und
 * beim Aushängen auf den Standardmodus zurück. Der Modus sprang dadurch je nach Verlauf zwischen
 * „resize“ und „pan“ – mal schob Android das Fenster, mal nicht. Den Modus setzt einmalig
 * `RootLayout` (`useResizeMode`); alles andere liest hier nur mit.
 */
export function useKeyboardHeight() {
  return useKeyboardContext().reanimated;
}

/**
 * Verlässt das fokussierte Feld, sobald die Tastatur eingefahren ist. Android schließt die Tastatur
 * per Zurück oder Wischgeste, ohne den Fokus zu nehmen – das Feld bliebe aktiv, und ein Tipp
 * daneben bewirkt nichts mehr (eine Liste blendet nur bei offener Tastatur aus). Für Inline-Felder,
 * bei denen Verlassen eine Aktion ist: Umbenennen verwerfen (1d, 5a), Zahl im Mengenregler übernehmen.
 * `enabled` nur, solange so ein Feld aktiv ist – der Hook trifft das gerade fokussierte Feld.
 */
export function useBlurOnKeyboardHide(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      const input = TextInput.State.currentlyFocusedInput();
      if (input) TextInput.State.blurTextInput(input);
    });
    return () => subscription.remove();
  }, [enabled]);
}

/** Abstand zwischen Eingabefeld und Tastatur beim Hochscrollen. */
const FOCUSED_INPUT_MARGIN = 16;

/**
 * Hält ein fokussiertes Eingabefeld in einer Liste über der Tastatur (Inline-Umbenennen, Zahl im
 * Mengenregler): Ist es nach dem Einblenden verdeckt, wird um die Überdeckung gescrollt. Die Liste
 * braucht dafür am Ende Platz in Tastaturhöhe (`KeyboardSpacer`).
 * `enabled` nur, solange ein Feld *dieser* Liste aktiv sein kann – sonst scrollt eine verdeckte
 * Liste im Hintergrund mit, wenn anderswo (Sheet, Dialog) ein Feld den Fokus bekommt.
 */
export function useScrollFocusedInputIntoView(enabled: boolean, scrollBy: (dy: number) => void) {
  const scrollByRef = useRef(scrollBy);
  useEffect(() => {
    scrollByRef.current = scrollBy;
  });

  useEffect(() => {
    if (!enabled) return;
    const subscription = Keyboard.addListener("keyboardDidShow", (event) => {
      const input = TextInput.State.currentlyFocusedInput();
      input?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height + FOCUSED_INPUT_MARGIN - event.endCoordinates.screenY;
        if (overlap > 0) scrollByRef.current(overlap);
      });
    });
    return () => subscription.remove();
  }, [enabled]);
}
