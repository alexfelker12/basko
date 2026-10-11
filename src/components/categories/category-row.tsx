import { CheckIcon, GripHorizontalIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useIsActive, useReorderableDrag } from "react-native-reorderable-list";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { CATEGORY_NAME_MAX } from "@/lib/db/schema";
import { useAppForm } from "@/lib/form";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import type { CategoryRow } from "@/lib/queries/categories";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

import { categoryNameValidator } from "./new-category-dialog";

/** Anzahl Produkte als Chip (5a). */
function CountChip({ count }: { count: number }) {
  return (
    <View className="rounded-[999px] bg-chip px-2.5 py-1">
      <Text className="text-xs font-bold">{count}</Text>
    </View>
  );
}

interface DragSortRowProps {
  category: CategoryRow;
  /** Nur während eines Umbenennens: verwirft es (Tipp daneben). */
  onPress?: () => void;
  onLongPress: () => void;
}

/**
 * DragSortRow (5a/5b): Griff ≡, Name, Anzahl Produkte. Gezogen wird nur am Griff – sofort,
 * ohne langen Druck, mit leichter Vibration beim Anheben. Die angehobene Zeile liegt als Karte
 * über der Liste. Langer Druck auf den Rest der Zeile benennt um.
 */
export function DragSortRow({ category, onPress, onLongPress }: DragSortRowProps) {
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn(
        "flex-row items-center gap-2 py-1.25",
        isActive
          ? "mx-3 rounded-card border border-line bg-surface px-1.5 shadow-md"
          : "mx-page border-b border-line"
      )}
    >
      <Pressable
        onPressIn={() => {
          hapticTap();
          drag();
        }}
        role="button"
        aria-label={t("storeOrder.drag", { name: category.name })}
        className="-ml-3 size-11 items-center justify-center"
      >
        <Icon
          as={GripHorizontalIcon}
          size="lg"
          className={cn(isActive ? "text-primary" : "text-soft")}
        />
      </Pressable>
      <Text numberOfLines={1} className="flex-1 text-base font-bold">
        {category.name}
      </Text>
      <CountChip count={category.productCount} />
    </Pressable>
  );
}

interface CategoryRenameRowProps {
  category: CategoryRow;
  /** Namen aller anderen Kategorien (eindeutig ohne Beachtung der Groß-/Kleinschreibung). */
  otherNames: string[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/**
 * Inline-Umbenennen (5a), gleiche Regeln wie bei Listen: gespeichert wird nur mit Haken oder Enter;
 * Tastatur schließen, daneben tippen oder Zurück verwirft. Ein vergebener Name zeigt einen Fehler
 * unter dem Feld, der Haken ist dann ausgegraut.
 */
export function CategoryRenameRow({
  category,
  otherNames,
  onSubmit,
  onCancel,
}: CategoryRenameRowProps) {
  const form = useAppForm({
    defaultValues: { name: category.name } as CategoryFormValues,
    validators: { onChange: categoryFormSchema },
    onSubmit: ({ value }) => onSubmit(value.name.trim()),
  });

  return (
    <View className="mx-page flex-row items-start gap-2 border-b border-line py-1.25">
      <View className="-ml-3 size-11 items-center justify-center">
        <Icon as={GripHorizontalIcon} size="lg" className="text-soft opacity-40" />
      </View>
      <form.AppField name="name" validators={{ onChange: categoryNameValidator(otherNames) }}>
        {(field) => (
          <field.TextField
            autoFocus
            selectTextOnFocus
            maxLength={CATEGORY_NAME_MAX}
            returnKeyType="done"
            onSubmitEditing={() => form.handleSubmit()}
            onBlur={onCancel}
            accessibilityLabel={t("storeOrder.nameInput")}
            className="flex-1"
            size="sm"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("storeOrder.saveName")} icon={CheckIcon} />
      </form.AppForm>
    </View>
  );
}
