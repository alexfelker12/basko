import { ChevronLeftIcon } from "lucide-react-native";
import { View } from "react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LIST_ITEM_NOTE_MAX } from "@/lib/db/schema";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import type { ItemValues } from "@/lib/queries/list-items";
import { convertQuantity } from "@/lib/units";
import { itemFormSchema, type ItemFormValues } from "@/lib/validation";

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
  const form = useAppForm({
    defaultValues: {
      quantity: initial.quantity,
      unit: initial.unit,
      note: initial.note ?? "",
    } as ItemFormValues,
    validators: { onChange: itemFormSchema },
    onSubmit: ({ value }) => onSubmit(value),
  });

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

      <form.Subscribe selector={(state) => state.values.unit}>
        {(unit) => (
          <form.AppField name="quantity">{(field) => <field.QuantityField unit={unit} />}</form.AppField>
        )}
      </form.Subscribe>

      <form.AppField name="unit">
        {(field) => (
          <field.UnitField
            productName={product.name}
            onUnitChange={(from, to) =>
              form.setFieldValue("quantity", (quantity: number) => convertQuantity(quantity, from, to))
            }
          />
        )}
      </form.AppField>

      <form.AppField name="note">
        {(field) => (
          <field.TextField
            label={t("itemSheet.note")}
            placeholder={t("itemSheet.notePlaceholder")}
            maxLength={LIST_ITEM_NOTE_MAX}
            returnKeyType="done"
            maxLines={3}
          />
        )}
      </form.AppField>

      <View className="mt-1 flex-row gap-2.5">
        {onDelete && deleteLabel ? (
          <Button variant="secondary" className="flex-1" onPress={onDelete}>
            <ButtonText className="text-danger">{deleteLabel}</ButtonText>
          </Button>
        ) : null}
        <form.AppForm>
          <form.SubmitButton label={submitLabel} className="flex-1" />
        </form.AppForm>
      </View>
    </View>
  );
}
