import { MinusIcon, PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Button, ButtonIcon } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSheetKeyboardHandlers } from "@/hooks/use-sheet-keyboard";
import { formatQuantity, unitLabel } from "@/lib/format";
import { formatNumber, t } from "@/lib/i18n";
import {
  canDecrease,
  decreaseQuantity,
  increaseQuantity,
  parseQuantityInput,
  type Unit,
} from "@/lib/units";

interface QuantityStepperProps {
  value: number;
  unit: Unit;
  onChange: (value: number) => void;
}

/**
 * Stepper [− n +] (3a, 3e): Minus ausgegraut bei Menge ≤ Schrittweite.
 * Ein Tipp auf die Zahl macht sie zum Eingabefeld mit Zahlentastatur (Komma und Punkt);
 * bei 0, leer oder ungültig wird der alte Wert wiederhergestellt.
 */
export function QuantityStepper({ value, unit, onChange }: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const sheetKeyboard = useSheetKeyboardHandlers();
  const label = `${formatQuantity(value, unit)} ${unitLabel(unit)}`;

  const commit = () => {
    if (draft === null) return;
    const parsed = parseQuantityInput(draft);
    setDraft(null);
    if (parsed !== null && parsed !== value) onChange(parsed);
  };

  return (
    <View className="flex-row items-center gap-1.5">
      <Button
        variant="secondary"
        size="icon"
        isDisabled={!canDecrease(value, unit)}
        onPress={() => onChange(decreaseQuantity(value, unit))}
        aria-label={t("quantity.decrease", { quantity: label })}
      >
        <ButtonIcon as={MinusIcon} className="h-4.5 w-4.5" />
      </Button>

      {draft !== null ? (
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onFocus={sheetKeyboard?.onFocus}
          onBlur={(event) => {
            sheetKeyboard?.onBlur(event);
            commit();
          }}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          textAlign="center"
          maxLength={9}
          aria-label={t("quantity.input")}
          className="h-11 min-w-14 rounded-[999px] border-2 border-primary bg-surface px-2 py-0 font-sans text-base font-extrabold text-ink"
        />
      ) : (
        <Pressable
          onPress={() => setDraft(formatNumber(value))}
          role="button"
          aria-label={t("quantity.edit", { quantity: label })}
          className="h-11 min-w-14 items-center justify-center rounded-[999px] border border-line bg-surface px-2"
        >
          <Text className="text-base font-extrabold">{formatQuantity(value, unit)}</Text>
        </Pressable>
      )}

      <Button
        variant="secondary"
        size="icon"
        onPress={() => onChange(increaseQuantity(value, unit))}
        aria-label={t("quantity.increase", { quantity: label })}
      >
        <ButtonIcon as={PlusIcon} className="h-4.5 w-4.5" />
      </Button>
    </View>
  );
}
