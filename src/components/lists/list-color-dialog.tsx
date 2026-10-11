import { View } from "react-native";

import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import type { ListColor } from "@/lib/list-colors";
import type { ListSummary } from "@/lib/queries/lists";

import { ListRowContent } from "./list-row";

interface ListColorDialogProps {
  list: ListSummary;
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: ListColor) => void;
}

/** Listenfarbe (3g): Vorschau der Listenzeile, 5 Farbkreise, Abbrechen und Fertig. */
export function ListColorDialog({ list, isOpen, onClose, onSave }: ListColorDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <ColorForm list={list} onClose={onClose} onSave={onSave} />
    </Dialog>
  );
}

function ColorForm({ list, onClose, onSave }: Omit<ListColorDialogProps, "isOpen">) {
  const form = useAppForm({
    defaultValues: { color: list.color },
    onSubmit: ({ value }) => onSave(value.color),
  });

  return (
    <>
      <Text role="heading" className="text-xl font-extrabold">
        {t("listColor.title")}
      </Text>
      <View className="rounded-card border border-line bg-bg px-3.5 py-3">
        <form.Subscribe selector={(state) => state.values.color}>
          {(color) => (
            <ListRowContent name={list.name} color={color} itemCount={list.itemCount} />
          )}
        </form.Subscribe>
      </View>
      <form.AppField name="color">{(field) => <field.ColorField />}</form.AppField>
      <AlertDialogFooter>
        <Button variant="secondary" onPress={onClose}>
          <ButtonText>{t("common.cancel")}</ButtonText>
        </Button>
        <form.AppForm>
          <form.SubmitButton label={t("common.done")} />
        </form.AppForm>
      </AlertDialogFooter>
    </>
  );
}
