import { useState } from "react";
import {
  Pressable,
  View,
  type BlurEvent,
  type FocusEvent,
  type TextInputProps,
} from "react-native";

import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
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
   * Für Felder in scrollenden Listen (7e): Ohne Fokus steht nur eine Anzeige im Feld-Look da, ein
   * Tipp macht daraus das echte Feld. Sonst hält Android ein Feld mit langem Text fest, sobald es
   * waagerecht scrollen kann – ein senkrechter Wisch darauf scrollte die Liste nicht.
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
  // tapToFocus: Erst ein Tipp macht aus der Anzeige ein echtes Feld (mit autoFocus), beim
  // Verlassen wird es wieder zur Anzeige. Programmatisches focus() auf ein durch pointerEvents
  // gesperrtes Feld verlor auf Android sofort den Fokus (er sprang ins erste Feld des Modals).
  const [editing, setEditing] = useState(false);
  const accessibleLabel = label ?? accessibilityLabel;

  if (tapToFocus && !editing) {
    return (
      <FieldShell label={label} error={error} className={className}>
        <Pressable
          onPress={() => setEditing(true)}
          disabled={isDisabled}
          role="button"
          aria-label={accessibleLabel}
          aria-disabled={isDisabled}
        >
          <View pointerEvents="none">
            <Input isInvalid={Boolean(error)} isDisabled={isDisabled} size={size}>
              <Text numberOfLines={1} className="flex-1 text-base font-semibold text-ink">
                {field.state.value}
              </Text>
            </Input>
          </View>
        </Pressable>
      </FieldShell>
    );
  }

  return (
    <FieldShell label={label} error={error} className={className}>
      <Input isInvalid={Boolean(error)} isDisabled={isDisabled} size={size}>
        <InputField
          {...inputProps}
          autoFocus={tapToFocus || inputProps.autoFocus}
          editable={!isDisabled}
          value={field.state.value}
          onChangeText={field.handleChange}
          onFocus={(event: FocusEvent) => sheetKeyboard?.onFocus(event)}
          onBlur={(event: BlurEvent) => {
            sheetKeyboard?.onBlur(event);
            field.handleBlur();
            onBlur?.();
            setEditing(false);
          }}
          aria-label={accessibleLabel}
        />
      </Input>
    </FieldShell>
  );
}
