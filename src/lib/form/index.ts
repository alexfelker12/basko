import { createFormHook } from "@tanstack/react-form";

import { ColorFieldComponent } from "@/components/form/color-field";
import { QuantityFieldComponent } from "@/components/form/quantity-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextFieldComponent } from "@/components/form/text-field";
import { UnitFieldComponent } from "@/components/form/unit-field";

import { fieldContext, formContext } from "./form-context";

/**
 * Formulare mit TanStack Form (Aufbau wie in digi-list): wiederverwendbare Feld-Komponenten
 * über `form.AppField` (`field.TextField` …), Formular-Komponenten über `form.AppForm`.
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField: TextFieldComponent,
    QuantityField: QuantityFieldComponent,
    UnitField: UnitFieldComponent,
    ColorField: ColorFieldComponent,
  },
  formComponents: { SubmitButton },
  fieldContext,
  formContext,
});
