import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface FieldShellProps {
  label?: string;
  /** Kleiner Zusatz unter dem Label, z. B. „Schritt 50 g“. */
  hint?: string;
  error?: string;
  /** Label links, Steuerelement rechts (Mengenregler, 3e). */
  inline?: boolean;
  className?: string;
  children: ReactNode;
}

/** Gemeinsamer Rahmen der Formularfelder: Label (optional mit Zusatz), Feld, Fehlermeldung. */
export function FieldShell({ label, hint, error, inline, className, children }: FieldShellProps) {
  const labelBlock = label ? (
    <View className={cn(inline && "flex-1")}>
      <Text className="text-sm font-semibold">{label}</Text>
      {hint ? <Text className="text-xs text-soft">{hint}</Text> : null}
    </View>
  ) : null;

  return (
    <View className={cn("gap-2", className)}>
      {inline ? (
        <View className="flex-row items-center gap-3">
          {labelBlock}
          {children}
        </View>
      ) : (
        <>
          {labelBlock}
          {children}
        </>
      )}
      {error ? <Text className="text-xs font-semibold text-danger">{error}</Text> : null}
    </View>
  );
}

/** Erste Fehlermeldung eines Felds, sobald es berührt wurde. */
export function fieldError(meta: { isTouched: boolean; errors: unknown[] }): string | undefined {
  if (!meta.isTouched) return undefined;
  const [first] = meta.errors;
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if (typeof first === "object" && "message" in first) return String(first.message);
  return undefined;
}
