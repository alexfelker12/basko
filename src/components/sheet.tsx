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
  /** Wird aufgerufen, sobald das Sheet zu ist – auch nach Wegwischen, Zurück oder Tipp daneben. */
  onClose: () => void;
  /** 90 % Höhe mit scrollbarem Inhalt (z. B. `BottomSheetScrollView`) statt Höhe nach Inhalt. */
  fullHeight?: boolean;
  children: ReactNode;
}

/**
 * Sheet mit Griff auf Basis des gluestack BottomSheet (@gorhom/bottom-sheet), gesteuert über `isOpen`.
 * Eingabefelder darin heben das Sheet über die Tastatur (`useSheetKeyboardHandlers`).
 */
export function Sheet({ isOpen, onClose, fullHeight = false, children }: SheetProps) {
  const ref = useRef<BottomSheetRef>(null);
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    if (isOpen) ref.current?.open();
    else ref.current?.close();
  }, [isOpen]);

  return (
    <BottomSheet ref={ref} onClose={onClose}>
      <BottomSheetPortal
        snapPoints={fullHeight ? FULL_HEIGHT_SNAP_POINTS : undefined}
        enableDynamicSizing={!fullHeight}
        topInset={top}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={SheetBackdrop}
      >
        <BottomSheetContent className={cn("pb-safe", fullHeight && "flex-1")}>
          {children}
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
