import { ChevronLeftIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { QuantityStepper } from "@/components/quantity-stepper";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { LIST_ITEM_NOTE_MAX } from "@/lib/db/schema";
import { unitLabel } from "@/lib/format";
import { formatNumber, t } from "@/lib/i18n";
import type { ItemValues } from "@/lib/queries/list-items";
import { convertQuantity, getUnitRule } from "@/lib/units";

import { UnitPicker } from "./unit-picker";

export type ItemFormProduct = { name: string; categoryName: string };

interface ItemFormProps {
  product: ItemFormProduct;
  initial: ItemValues;
  /** ‹ zurück zur Suche (3e). */
  onBack?: () => void;
  /** „Zur Liste hinzufügen“ bzw. „Fertig“. */
  onSubmit: (values: ItemValues) => void;
  submitLabel: string;
  /** „Eintrag löschen“ (3) / „Eintrag entfernen“ (2c); fehlt beim Hinzufügen. */
  onDelete?: () => void;
  deleteLabel?: string;
}

/**
 * Inhalt von Hinzufügen-Sheet (3e), Bearbeiten-Sheet (3) und Schnell-Bearbeiten (2c):
 * Menge mit Schrittweite, Einheiten inkl. „Weitere Einheiten“, Notiz (max. 100).
 * Gespeichert wird erst mit dem Knopf; Wegwischen verwirft.
 */
export function ItemForm({
  product,
  initial,
  onBack,
  onSubmit,
  submitLabel,
  onDelete,
  deleteLabel,
}: ItemFormProps) {
  const [quantity, setQuantity] = useState(initial.quantity);
  const [unit, setUnit] = useState(initial.unit);
  const [note, setNote] = useState(initial.note ?? "");

  const step = getUnitRule(unit).step;

  return (
    <View className="gap-4 px-page pb-4">
      <View className="flex-row items-center gap-3">
        {onBack ? (
          <Button variant="secondary" size="icon" onPress={onBack} aria-label={t("common.back")}>
            <ButtonIcon as={ChevronLeftIcon} />
          </Button>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-lg font-extrabold">
            {product.name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-soft">
            {product.categoryName}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold">{t("itemSheet.quantity")}</Text>
          <Text className="text-xs text-soft">
            {t("itemSheet.step", { step: formatNumber(step), unit: unitLabel(unit) })}
          </Text>
        </View>
        <QuantityStepper value={quantity} unit={unit} onChange={setQuantity} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold">{t("itemSheet.unit")}</Text>
        <UnitPicker
          value={unit}
          productName={product.name}
          onChange={(next) => {
            setQuantity(convertQuantity(quantity, unit, next));
            setUnit(next);
          }}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold">{t("itemSheet.note")}</Text>
        <Input>
          <InputField
            value={note}
            onChangeText={setNote}
            placeholder={t("itemSheet.notePlaceholder")}
            maxLength={LIST_ITEM_NOTE_MAX}
            returnKeyType="done"
            aria-label={t("itemSheet.note")}
          />
        </Input>
      </View>

      <View className="mt-1 flex-row gap-2.5">
        {onDelete && deleteLabel ? (
          <Button variant="secondary" className="flex-1" onPress={onDelete}>
            <ButtonText className="text-danger">{deleteLabel}</ButtonText>
          </Button>
        ) : null}
        <Button className="flex-1" onPress={() => onSubmit({ quantity, unit, note })}>
          <ButtonText>{submitLabel}</ButtonText>
        </Button>
      </View>
    </View>
  );
}
