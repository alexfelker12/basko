import type { ReactNode } from "react";
import { View } from "react-native";

import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent } from "@/components/ui/alert-dialog";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tipp daneben schließt den Dialog (Standard). Zurück schließt immer. */
  closeOnOverlayClick?: boolean;
  children: ReactNode;
}

/**
 * Kleiner Dialog (AlertDialog, z. B. 1f, 3g), mittig zwischen sicherem oberen Rand und Tastatur:
 * oben ein Platzhalter in Höhe des Safe-Area-Insets, unten einer in Tastaturhöhe.
 * Der Inhalt wird bei jedem Öffnen neu eingehängt (frische Formulare).
 */
export function Dialog({ isOpen, onClose, closeOnOverlayClick = true, children }: DialogProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={closeOnOverlayClick}
      size="lg"
    >
      <AlertDialogBackdrop />
      <View className="pt-safe" />
      {isOpen ? <AlertDialogContent>{children}</AlertDialogContent> : null}
      <KeyboardSpacer />
    </AlertDialog>
  );
}
