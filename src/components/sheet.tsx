import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useEffect, useRef, type ReactNode } from "react";
import { AppState, BackHandler, Keyboard } from "react-native";
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
/** Nach der Rückkehr in die App: warten, bis Android Fenster und Inhalt neu vermessen hat. */
const RESUME_SETTLE_MS = 300;

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} />;
}

interface SheetProps {
  isOpen: boolean;
  /**
   * Nur wenn die Nutzerin das Sheet selbst schließt (Wischen, Tipp daneben, Android-Zurück) –
   * der Aufrufer setzt dann seinen Zustand auf „zu“. Nicht bei `isOpen = false`.
   */
  onDismiss: () => void;
  /** Nach jeder abgeschlossenen Schließ-Animation, z. B. um das nächste Sheet zu öffnen. */
  onClosed?: () => void;
  /**
   * Android-Zurück führt zu einem vorigen Sheet statt zu schließen (z. B. Hinzufügen 3e → Suche 3c).
   * Ohne `onBack` schließt Zurück dieses Sheet wie Wischen.
   */
  onBack?: () => void;
  /** 90 % Höhe mit scrollbarem Inhalt (z. B. `BottomSheetScrollView`) statt Höhe nach Inhalt. */
  fullHeight?: boolean;
  children: ReactNode;
}

/**
 * Sheet mit Griff auf Basis des gluestack BottomSheet (@gorhom/bottom-sheet), gesteuert über `isOpen`.
 * Eingabefelder darin heben das Sheet über die Tastatur (`useSheetKeyboardHandlers`).
 */
export function Sheet({
  isOpen,
  onDismiss,
  onClosed,
  onBack,
  fullHeight = false,
  children,
}: SheetProps) {
  const ref = useRef<BottomSheetRef>(null);
  const isOpenRef = useRef(isOpen);
  const onDismissRef = useRef(onDismiss);
  const onClosedRef = useRef(onClosed);
  const onBackRef = useRef(onBack);
  const { top } = useSafeAreaInsets();

  // Immer die aktuellen Werte – gorhom ruft den Schließ-Callback erst nach der Animation auf
  useEffect(() => {
    isOpenRef.current = isOpen;
    onDismissRef.current = onDismiss;
    onClosedRef.current = onClosed;
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (isOpen) {
      // Ein neues Sheet verdeckt das Feld darunter (z. B. Name → „Kategorie“ 4e, Notiz → „Weitere
      // Einheiten“) – die Tastatur gehört zu diesem Feld und schließt deshalb. Felder im neuen Sheet
      // mit `autoFocus` hängen sich erst danach ein und öffnen sie wieder.
      Keyboard.dismiss();
      ref.current?.open();
    } else ref.current?.close();
  }, [isOpen]);

  // Android-Zurück schließt nur dieses Sheet (wie Wischen) bzw. geht mit `onBack` einen Schritt
  // zurück. Der zuletzt angemeldete Handler kommt zuerst dran – bei verschachtelten Sheets also
  // das obere, das untere bleibt offen. Ohne das schloss Zurück den Screen oder die App.
  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (onBackRef.current) onBackRef.current();
      else ref.current?.close();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);

  // Android: Nach Kamera oder Galerie (eigene Activity) blieb das Sheet manchmal unten liegen –
  // nur Griff und Abdunklung sichtbar, bis man am Griff zieht. Vermutlich vermisst gorhom die
  // Höhe beim Zurückkehren neu, bewegt das Sheet aber nicht mit. Daher einmal neu einrasten.
  // Bei offener Tastatur nicht: Dort steht das Sheet absichtlich höher.
  useEffect(() => {
    if (!isOpen) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      clearTimeout(timer);
      if (state !== "active") return;
      timer = setTimeout(() => {
        if (isOpenRef.current && !Keyboard.isVisible()) ref.current?.snapToIndex(0);
      }, RESUME_SETTLE_MS);
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
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
