import type { BlurEvent, FocusEvent, TextInputProps } from "react-native";

import { Input, InputField } from "@/components/ui/input";
import { useSheetKeyboardHandlers } from "@/hooks/use-sheet-keyboard";
import { useFieldContext } from "@/lib/form/form-context";

import { FieldShell, fieldError } from "./field-shell";

type TextFieldProps = Pick<
  TextInputProps,
  "placeholder" | "autoFocus" | "maxLength" | "returnKeyType" | "selectTextOnFocus" | "onSubmitEditing"
> & {
  label?: string;
  /** Accessibility-Label, wenn kein sichtbares Label (z. B. Inline-Umbenennen). */
  accessibilityLabel?: string;
  /** Zusätzlich zu `field.handleBlur`, z. B. „Umbenennen verwerfen“ (1d). */
  onBlur?: () => void;
  /** Höhe: default 48, sm 44 (Inline-Umbenennen). */
  size?: "default" | "sm";
  /** Ausgegraut und nicht bearbeitbar (z. B. abgewählte Zutat in 7e). */
  isDisabled?: boolean;
  /** Text bricht um, das Feld wächst mit – für Felder in scrollenden Listen (7e), siehe `WRAP_PROPS`. */
  wrap?: boolean;
  /** Zusätzlich zur Tastatur-Anmeldung im Sheet, z. B. Feld in den sichtbaren Bereich scrollen. */
  onFocus?: () => void;
  className?: string;
};

/** Textfeld (gluestack Input, Höhe 48, Fokus = 2 px primary) – im Sheet keyboard aware. */
export function TextFieldComponent({
  label,
  accessibilityLabel,
  onBlur,
  onFocus,
  size = "default",
  isDisabled = false,
  wrap = false,
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const sheetKeyboard = useSheetKeyboardHandlers();
  const error = fieldError(field.state.meta);

  return (
    <FieldShell label={label} error={error} className={className}>
      <Input
        isInvalid={Boolean(error)}
        isDisabled={isDisabled}
        size={size}
        className={wrap ? (size === "sm" ? "h-auto min-h-11" : "h-auto min-h-12") : undefined}
      >
        <InputField
          {...inputProps}
          {...(wrap ? WRAP_PROPS : null)}
          className={wrap ? (size === "sm" ? "h-auto py-2.5" : "h-auto py-3") : undefined}
          editable={!isDisabled}
          value={field.state.value}
          // Umbrechende Felder sind technisch mehrzeilig – Zeilenumbrüche (z. B. beim Einfügen)
          // werden zu Leerzeichen, ein Name bleibt eine Zeile Text
          onChangeText={(text: string) =>
            field.handleChange(wrap ? text.replace(/\s*\n\s*/g, " ") : text)
          }
          onFocus={(event: FocusEvent) => {
            sheetKeyboard?.onFocus(event);
            onFocus?.();
          }}
          onBlur={(event: BlurEvent) => {
            sheetKeyboard?.onBlur(event);
            field.handleBlur();
            onBlur?.();
          }}
          aria-label={label ?? accessibilityLabel}
        />
      </Input>
    </FieldShell>
  );
}

/**
 * `wrap`: Der Text bricht um, das Feld wächst mit und scrollt nie selbst. Android lässt die
 * umgebende Liste nur dann eine Berührung übernehmen, wenn das Feld in keine Richtung scrollen
 * kann – ein einzeiliges Feld mit langem Text konnte waagerecht scrollen und hielt jeden
 * senkrechten Wisch fest (7e). Enter schließt das Feld statt eine neue Zeile anzufangen.
 */
const WRAP_PROPS = {
  multiline: true,
  scrollEnabled: false,
  submitBehavior: "blurAndSubmit",
} satisfies TextInputProps;
