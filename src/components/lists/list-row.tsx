import { CheckIcon, EllipsisIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { ListColorBar } from "@/components/list-color-bar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import type { ListColor } from "@/lib/list-colors";
import type { ListSummary } from "@/lib/queries/lists";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Farbbalken, Name und „{n} Produkte“ – auch als Kopf im Menü (1e) und Vorschau im Farbdialog (3g). */
export function ListRowContent({
  name,
  color,
  itemCount,
  large,
  className,
}: {
  name: string;
  color: ListColor;
  itemCount: number;
  large?: boolean;
  className?: string;
}) {
  return (
    <View className={cn("flex-row items-center gap-3.5", className)}>
      <ListColorBar color={color} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className={cn("font-bold", large ? "text-lg" : "text-base")}>
          {name}
        </Text>
        <Text className="mt-0.5 text-xs text-soft">
          {t("lists.productCount", { count: itemCount })}
        </Text>
      </View>
    </View>
  );
}

interface ListRowProps {
  list: ListSummary;
  onPress: () => void;
  onLongPress: () => void;
  onMorePress: () => void;
}

/** ListRow (1a): Tipp öffnet den Einkaufsmodus, langer Druck benennt um, „···“ öffnet das Menü. */
export function ListRow({ list, onPress, onLongPress, onMorePress }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="mx-page flex-row items-center gap-3 border-b border-line py-row active:opacity-70"
    >
      <ListRowContent
        name={list.name}
        color={list.color}
        itemCount={list.itemCount}
        className="flex-1"
      />
      <Pressable
        onPress={onMorePress}
        role="button"
        aria-label={t("lists.actions", { name: list.name })}
        className="-mr-2.5 size-11 items-center justify-center"
      >
        <Icon as={EllipsisIcon} size="lg" className="text-soft" />
      </Pressable>
    </Pressable>
  );
}

interface ListRenameRowProps {
  list: ListSummary;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/**
 * Inline-Umbenennen (1d): gespeichert wird nur mit Haken oder Enter.
 * Tastatur schließen, daneben tippen oder Zurück verwirft die Änderung.
 * Gleiche Höhe wie die normale Zeile (Feld und Haken 44), damit nichts springt.
 */
export function ListRenameRow({ list, onSubmit, onCancel }: ListRenameRowProps) {
  const form = useAppForm({
    defaultValues: { name: list.name },
    onSubmit: ({ value }) => onSubmit(value.name),
  });

  return (
    <View className="mx-page flex-row items-center gap-3 border-b border-line py-row">
      <ListColorBar color={list.color} />
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => form.handleSubmit()}
            onBlur={onCancel}
            accessibilityLabel={t("lists.nameInput")}
            className="flex-1"
            size="sm"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("lists.saveName")} icon={CheckIcon} />
      </form.AppForm>
    </View>
  );
}
