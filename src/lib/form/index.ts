import { createFormHook } from "@tanstack/react-form";

import { CheckboxFieldComponent } from "@/components/form/checkbox-field";
import { ColorFieldComponent } from "@/components/form/color-field";
import { PhotosFieldComponent } from "@/components/form/photos-field";
import { QuantityFieldComponent } from "@/components/form/quantity-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextFieldComponent } from "@/components/form/text-field";
import { UnitFieldComponent } from "@/components/form/unit-field";

import { fieldContext, formContext } from "./form-context";

/**
 * Formulare mit TanStack Form (Aufbau wie in digi-list): wiederverwendbare Feld-Komponenten
 * über `form.AppField` (`field.TextField` …), Formular-Komponenten über `form.AppForm`.
 *
 * Nicht registriert ist `CategoryFieldComponent`: Sie enthält „Kategorie wählen“ (4e) samt
 * „Neue Kategorie“ (5c), und dieser Dialog nutzt selbst `useAppForm` – das ergäbe einen
 * Require-Zyklus. Sie wird direkt in `form.AppField` gerendert und liest das Feld über den Kontext.
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField: TextFieldComponent,
    QuantityField: QuantityFieldComponent,
    UnitField: UnitFieldComponent,
    ColorField: ColorFieldComponent,
    CheckboxField: CheckboxFieldComponent,
    PhotosField: PhotosFieldComponent,
  },
  formComponents: { SubmitButton },
  fieldContext,
  formContext,
});
