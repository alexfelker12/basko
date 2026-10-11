import { QuantityStepper } from "@/components/quantity-stepper";
import { unitLabel } from "@/lib/format";
import { useFieldContext } from "@/lib/form/form-context";
import { formatNumber, t } from "@/lib/i18n";
import { getUnitRule, type Unit } from "@/lib/units";

import { FieldShell, fieldError } from "./field-shell";

/** Menge mit Schrittweite (3e): „Menge · Schritt 50 g“ links, Mengenregler rechts. */
export function QuantityFieldComponent({ unit }: { unit: Unit }) {
  const field = useFieldContext<number>();
  const step = getUnitRule(unit).step;

  return (
    <FieldShell
      inline
      label={t("itemSheet.quantity")}
      hint={t("itemSheet.step", { step: formatNumber(step), unit: unitLabel(unit) })}
      error={fieldError(field.state.meta)}
    >
      <QuantityStepper value={field.state.value} unit={unit} onChange={field.handleChange} />
    </FieldShell>
  );
}
