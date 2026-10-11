import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useEffect, useRef, type ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BottomSheet,
  BottomSheetBackdrop,
  BottomSheetContent,
  BottomSheetPortal,
  type BottomSheetRef,
} from "@/components/ui/bottomsheet";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Hohe Sheets (Suche 3c) belegen 90 % der Höhe, alle anderen passen sich dem Inhalt an. */
const FULL_HEIGHT_SNAP_POINTS = ["90%"];

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} />;
}

interface SheetProps {
  isOpen: boolean;
  /**
   * Nur wenn die Nutzerin das Sheet selbst schließt (Wischen, Tipp daneben, Zurück) –
   * der Aufrufer setzt dann seinen Zustand auf „zu“. Nicht bei `isOpen = false`.
   */
  onDismiss: () => void;
  /** Nach jeder abgeschlossenen Schließ-Animation, z. B. um das nächste Sheet zu öffnen. */
  onClosed?: () => void;
  /** 90 % Höhe mit scrollbarem Inhalt (z. B. `BottomSheetScrollView`) statt Höhe nach Inhalt. */
  fullHeight?: boolean;
  children: ReactNode;
}

/**
 * Sheet mit Griff auf Basis des gluestack BottomSheet (@gorhom/bottom-sheet), gesteuert über `isOpen`.
 * Eingabefelder darin heben das Sheet über die Tastatur (`useSheetKeyboardHandlers`).
 */
export function Sheet({ isOpen, onDismiss, onClosed, fullHeight = false, children }: SheetProps) {
  const ref = useRef<BottomSheetRef>(null);
  const isOpenRef = useRef(isOpen);
  const onDismissRef = useRef(onDismiss);
  const onClosedRef = useRef(onClosed);
  const { top } = useSafeAreaInsets();

  // Immer die aktuellen Werte – gorhom ruft den Schließ-Callback erst nach der Animation auf
  useEffect(() => {
    isOpenRef.current = isOpen;
    onDismissRef.current = onDismiss;
    onClosedRef.current = onClosed;
  });

  useEffect(() => {
    if (isOpen) ref.current?.open();
    else ref.current?.close();
  }, [isOpen]);

  const handleClosed = () => {
    onClosedRef.current?.();
    // Steht der Aufrufer noch auf „offen“, hat die Nutzerin das Sheet geschlossen
    if (isOpenRef.current) onDismissRef.current();
  };

  return (
    <BottomSheet ref={ref} onClose={handleClosed}>
      <BottomSheetPortal
        snapPoints={fullHeight ? FULL_HEIGHT_SNAP_POINTS : undefined}
        enableDynamicSizing={!fullHeight}
        topInset={top}
        // Das Fenster ändert sich mit der Tastatur nicht (siehe `useResizeMode` in `RootLayout`),
        // daher verschiebt gorhom das Sheet selbst – auf Android über den „adjustPan“-Weg.
        // Hohe Sheets bleiben stehen (`extend`), ihr Inhalt bekommt unten einen `KeyboardSpacer`.
        keyboardBehavior={fullHeight ? "extend" : "interactive"}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        backdropComponent={SheetBackdrop}
      >
        <BottomSheetContent className={cn("pb-safe", fullHeight && "flex-1")}>
          {children}
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
