import { ChevronRightIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";

import { CategoryPickerSheet } from "@/components/categories/category-picker-sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCategories } from "@/hooks/use-categories";
import { useFieldContext } from "@/lib/form/form-context";
import { t } from "@/lib/i18n";

import { FieldShell } from "./field-shell";

/** Kategorie (4d): zeigt die gewählte Kategorie, › öffnet „Kategorie wählen“ (4e). */
export function CategoryFieldComponent() {
  const field = useFieldContext<string>();
  const { data: categories = [] } = useCategories();
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = categories.find((category) => category.id === field.state.value);

  return (
    <FieldShell label={t("productForm.category")}>
      <Pressable
        onPress={() => setPickerOpen(true)}
        role="button"
        aria-label={t("productForm.chooseCategory", { name: selected?.name ?? "" })}
        className="h-12 flex-row items-center rounded-card border border-line bg-bg pl-3.5 pr-2 active:opacity-70"
      >
        <Text numberOfLines={1} className="flex-1 text-base font-semibold">
          {selected?.name ?? ""}
        </Text>
        <Icon as={ChevronRightIcon} size="lg" className="text-soft" />
      </Pressable>

      <CategoryPickerSheet
        isOpen={pickerOpen}
        value={field.state.value}
        onClose={() => setPickerOpen(false)}
        onSelect={(categoryId) => {
          setPickerOpen(false);
          field.handleChange(categoryId);
        }}
      />
    </FieldShell>
  );
}
