import { UnitPicker } from "@/components/items/unit-picker";
import { useFieldContext } from "@/lib/form/form-context";
import { t } from "@/lib/i18n";
import type { Unit } from "@/lib/units";

import { FieldShell } from "./field-shell";

interface UnitFieldProps {
  productName: string;
  /** Vor dem Wechsel aufgerufen – z. B. um die Menge umzurechnen (kg ↔ g). */
  onUnitChange?: (from: Unit, to: Unit) => void;
}

/** Einheiten-Chips inkl. „Weitere Einheiten“ (3e, 3e·2, 3e·3). */
export function UnitFieldComponent({ productName, onUnitChange }: UnitFieldProps) {
  const field = useFieldContext<Unit>();

  return (
    <FieldShell label={t("itemSheet.unit")}>
      <UnitPicker
        value={field.state.value}
        productName={productName}
        onChange={(next) => {
          if (next === field.state.value) return;
          onUnitChange?.(field.state.value, next);
          field.handleChange(next);
        }}
      />
    </FieldShell>
  );
}
