import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { useMemo } from "react";
/** Fokus-/Blur-Ereignis eines Eingabefelds – nur die Ziel-ID wird gebraucht. */
type FocusEvent = { nativeEvent: { target?: number | null } };

/**
 * Macht ein beliebiges Eingabefeld im BottomSheet „keyboard aware“ – wie `BottomSheetTextInput`
 * von @gorhom/bottom-sheet: Beim Fokus merkt sich das Sheet das Feld und hebt sich über die Tastatur.
 * Außerhalb eines Sheets liefert der Hook `null`, die Felder bleiben also überall verwendbar.
 */
export function useSheetKeyboardHandlers() {
  const sheet = useBottomSheetInternal(true);

  return useMemo(() => {
    if (!sheet) return null;
    const { animatedKeyboardState } = sheet;
    return {
      onFocus: (event: FocusEvent) =>
        animatedKeyboardState.set((state) => ({
          ...state,
          target: event.nativeEvent.target ?? undefined,
        })),
      onBlur: (event: FocusEvent) => {
        if (animatedKeyboardState.get().target === event.nativeEvent.target) {
          animatedKeyboardState.set((state) => ({ ...state, target: undefined }));
        }
      },
    };
  }, [sheet]);
}
