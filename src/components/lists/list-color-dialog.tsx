import { useState } from "react";
import { View } from "react-native";

import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
    <AlertDialog isOpen={isOpen} onClose={onClose} size="lg">
      <AlertDialogBackdrop />
      {isOpen ? <ColorForm list={list} onClose={onClose} onSave={onSave} /> : null}
    </AlertDialog>
  );
}

function ColorForm({ list, onClose, onSave }: Omit<ListColorDialogProps, "isOpen">) {
  const [color, setColor] = useState(list.color);

  return (
    <AlertDialogContent>
      <Text role="heading" className="text-xl font-extrabold">
        {t("listColor.title")}
      </Text>
      <View className="rounded-card border border-line bg-bg px-3.5 py-3">
        <ListRowContent name={list.name} color={color} itemCount={list.itemCount} />
      </View>
      <ColorSwatchPicker value={color} onChange={setColor} />
      <AlertDialogFooter>
        <Button variant="secondary" onPress={onClose}>
          <ButtonText>{t("common.cancel")}</ButtonText>
        </Button>
        <Button onPress={() => onSave(color)}>
          <ButtonText>{t("common.done")}</ButtonText>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
