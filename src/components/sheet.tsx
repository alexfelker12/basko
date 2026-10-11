import type { ReactNode } from "react";

import { KeyboardSpacer } from "@/components/keyboard-spacer";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface SheetProps {
  isOpen: boolean;
  /** Wegwischen, Zurück oder Tipp daneben. */
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Actionsheet mit Griff (Komponenten 10a); Inhalte wandern über die Tastatur. */
export function Sheet({ isOpen, onClose, children, className }: SheetProps) {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={cn("items-stretch", className)}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {children}
        <KeyboardSpacer />
      </ActionsheetContent>
    </Actionsheet>
  );
}
