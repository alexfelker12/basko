import type { ReactNode } from "react";

import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent } from "@/components/ui/alert-dialog";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Kleiner Dialog (AlertDialog, z. B. 1f, 3g). Der Platzhalter in Tastaturhöhe unter dem Inhalt
 * hält den Dialog über der Tastatur. Der Inhalt wird bei jedem Öffnen neu eingehängt (frische Formulare).
 */
export function Dialog({ isOpen, onClose, children }: DialogProps) {
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size="lg">
      <AlertDialogBackdrop />
      {isOpen ? <AlertDialogContent>{children}</AlertDialogContent> : null}
      <KeyboardSpacer />
    </AlertDialog>
  );
}
