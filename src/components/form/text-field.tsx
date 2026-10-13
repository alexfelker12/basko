import type { BlurEvent, FocusEvent, TextInputProps } from "react-native";

import { Input, InputField } from "@/components/ui/input";
import { useBlurOnKeyboardHide } from "@/hooks/use-keyboard";
import { useSheetKeyboardHandlers } from "@/hooks/use-sheet-keyboard";
import { useFieldContext } from "@/lib/form/form-context";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

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
  /** Text bricht um, das Feld wächst mit und scrollt nie – für Felder in scrollenden Listen (7e). */
  wrap?: boolean;
  /** Text bricht um, das Feld wächst bis zu so vielen Zeilen und scrollt dann senkrecht (Notiz). */
  maxLines?: keyof typeof MAX_LINES_CLASS;
  /** Zusätzlich zur Tastatur-Anmeldung im Sheet, z. B. Feld in den sichtbaren Bereich scrollen. */
  onFocus?: () => void;
  /** Eingefahrene Tastatur verlässt das Feld (`onBlur`) – Inline-Umbenennen (1d, 5a). */
  blurOnKeyboardHide?: boolean;
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
  maxLines,
  blurOnKeyboardHide = false,
  className,
  ...inputProps
}: TextFieldProps) {
  useBlurOnKeyboardHide(blurOnKeyboardHide);
  const field = useFieldContext<string>();
  const sheetKeyboard = useSheetKeyboardHandlers();
  const error = fieldError(field.state.meta);
  const grows = wrap || maxLines !== undefined;

  return (
    <FieldShell label={label} error={error} className={className}>
      <Input
        isInvalid={Boolean(error)}
        isDisabled={isDisabled}
        size={size}
        className={grows ? GROW_CLASSES[size].root : undefined}
      >
        <InputField
          {...inputProps}
          {...(grows ? GROW_PROPS : null)}
          // Bis `maxLines` wächst das Feld, danach scrollt es senkrecht; `wrap` scrollt nie
          scrollEnabled={maxLines !== undefined}
          className={
            grows
              ? cn(
                  GROW_CLASSES[size].field,
                  maxLines !== undefined && MAX_LINES_CLASS[maxLines][size]
                )
              : undefined
          }
          editable={!isDisabled}
          value={field.state.value}
          // Wachsende Felder sind technisch mehrzeilig – Zeilenumbrüche (z. B. beim Einfügen)
          // werden zu Leerzeichen, der Text bleibt ein Absatz
          onChangeText={(text: string) =>
            field.handleChange(grows ? text.replace(/\s*\n\s*/g, " ") : text)
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
 * Wachsende Felder (`wrap`, `maxLines`): mehrzeiliges TextInput ohne feste Höhe – der Text bricht
 * um, das Feld wächst mit. Enter schließt das Feld statt eine neue Zeile anzufangen.
 * `wrap` scrollt nie selbst: Android lässt die umgebende Liste eine Berührung nur übernehmen, wenn
 * das Feld in keine Richtung scrollen kann – ein einzeiliges Feld mit langem Text konnte waagerecht
 * scrollen und hielt jeden senkrechten Wisch fest (7e).
 */
const GROW_PROPS = {
  multiline: true,
  submitBehavior: "blurAndSubmit",
} satisfies TextInputProps;

/** Mindesthöhe wie das einzeilige Feld; Zeilenhöhe von `text-base` = 24. */
const GROW_CLASSES = {
  default: { root: "h-auto min-h-12", field: "h-auto py-3" },
  sm: { root: "h-auto min-h-11", field: "h-auto py-2.5" },
} as const;

/** Höchsthöhe des Felds: Zeilen × 24 plus Innenabstand (default 24, sm 20). */
const MAX_LINES_CLASS = {
  3: { default: "max-h-24", sm: "max-h-23" },
} as const;
