import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { CheckIcon, PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { t } from "@/lib/i18n";

import { NewCategoryDialog } from "./new-category-dialog";

/** Zeilenhöhe 50 und Platz für Titel, „Neue Kategorie anlegen“, Griff und unteren Rand (4e). */
const ROW_HEIGHT = 50;
const CHROME_HEIGHT = 160;
/** Ab diesem Anteil der Bildschirmhöhe wird das Sheet hoch (90 %) und scrollt. */
const MAX_HEIGHT_RATIO = 0.85;

interface CategoryPickerSheetProps {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onSelect: (categoryId: string) => void;
}

/**
 * Kategorie wählen (4e): alle Kategorien in Ladenreihenfolge inkl. „Sonstiges“, Haken an der
 * gewählten. „+ Neue Kategorie anlegen“ öffnet 5c; die neue Kategorie ist danach ausgewählt.
 */
export function CategoryPickerSheet({
  isOpen,
  value,
  onClose,
  onSelect,
}: CategoryPickerSheetProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const [newOpen, setNewOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  // Sheets mit Höhe nach Inhalt messen sich selbst; ein `BottomSheetScrollView` darin meldet aber
  // nur die Höhe seines Inhalts (ohne Titel und unteren Rand) – das Sheet war dann zu niedrig und
  // „Neue Kategorie anlegen“ rutschte unter den Rand. Gescrollt wird daher nur im hohen Sheet.
  const scrollable =
    categories.length * ROW_HEIGHT + CHROME_HEIGHT > windowHeight * MAX_HEIGHT_RATIO;

  const create = (name: string) => {
    setNewOpen(false);
    createCategory.mutate(name, {
      onSuccess: (id) => {
        if (id) onSelect(id);
      },
    });
  };

  const rows = (
    <View className="px-page pb-2">
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            role="radio"
            aria-checked={selected}
            className="min-h-12.5 flex-row items-center border-b border-line active:opacity-70"
          >
            <Text numberOfLines={1} className="flex-1 text-base font-bold">
              {category.name}
            </Text>
            {selected ? <Icon as={CheckIcon} size="lg" className="text-primary" /> : null}
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => setNewOpen(true)}
        role="button"
        className="min-h-13.5 flex-row items-center gap-2.5 active:opacity-70"
      >
        <Icon as={PlusIcon} size="lg" className="text-primary" />
        <Text className="text-base font-bold text-primary">{t("categoryPicker.create")}</Text>
      </Pressable>
    </View>
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} fullHeight={scrollable}>
      <Text role="heading" className="px-page pb-2 pt-1 text-xl font-extrabold">
        {t("categoryPicker.title")}
      </Text>
      {scrollable ? <BottomSheetScrollView>{rows}</BottomSheetScrollView> : rows}

      <NewCategoryDialog isOpen={newOpen} onClose={() => setNewOpen(false)} onCreate={create} />
    </Sheet>
  );
}
