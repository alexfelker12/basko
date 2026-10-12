import { useRef, useState } from "react";
import {
  Pressable,
  View,
  type BlurEvent,
  type FocusEvent,
  type TextInput,
  type TextInputProps,
} from "react-native";

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
  /**
   * Für Felder in scrollenden Listen (7e): Das Feld nimmt Berührungen erst an, wenn es den Fokus
   * hat; vorher fokussiert ein Tipp es. Sonst hält Android ein Feld mit langem Text fest, sobald
   * es waagerecht scrollen kann – ein senkrechter Wisch darauf scrollte die Liste nicht.
   */
  tapToFocus?: boolean;
  className?: string;
};

/** Textfeld (gluestack Input, Höhe 48, Fokus = 2 px primary) – im Sheet keyboard aware. */
export function TextFieldComponent({
  label,
  accessibilityLabel,
  onBlur,
  size,
  isDisabled = false,
  tapToFocus = false,
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const sheetKeyboard = useSheetKeyboardHandlers();
  const error = fieldError(field.state.meta);
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const input = (
    <Input isInvalid={Boolean(error)} isDisabled={isDisabled} size={size}>
      <InputField
        {...inputProps}
        // Die Ref-Typen von InputField (gluestack) zeigen auf die Props statt auf das TextInput
        ref={inputRef as never}
        editable={!isDisabled}
        value={field.state.value}
        onChangeText={field.handleChange}
        onFocus={(event: FocusEvent) => {
          setFocused(true);
          sheetKeyboard?.onFocus(event);
        }}
        onBlur={(event: BlurEvent) => {
          setFocused(false);
          sheetKeyboard?.onBlur(event);
          field.handleBlur();
          onBlur?.();
        }}
        aria-label={label ?? accessibilityLabel}
      />
    </Input>
  );

  return (
    <FieldShell label={label} error={error} className={className}>
      {tapToFocus ? (
        <Pressable
          onPress={() => inputRef.current?.focus()}
          disabled={isDisabled || focused}
          accessible={false}
        >
          <View pointerEvents={focused ? "auto" : "none"}>{input}</View>
        </Pressable>
      ) : (
        input
      )}
    </FieldShell>
  );
}
