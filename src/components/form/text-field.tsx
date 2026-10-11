import type { BlurEvent, TextInputProps } from "react-native";

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
  className?: string;
};

/** Textfeld (gluestack Input, Höhe 48, Fokus = 2 px primary) – im Sheet keyboard aware. */
export function TextFieldComponent({
  label,
  accessibilityLabel,
  onBlur,
  size,
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const sheetKeyboard = useSheetKeyboardHandlers();
  const error = fieldError(field.state.meta);

  return (
    <FieldShell label={label} error={error} className={className}>
      <Input isInvalid={Boolean(error)} size={size}>
        <InputField
          {...inputProps}
          value={field.state.value}
          onChangeText={field.handleChange}
          onFocus={sheetKeyboard?.onFocus}
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
