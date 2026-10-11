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
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";
import { DEFAULT_LIST_COLOR, type ListColor } from "@/lib/list-colors";

interface NewListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: ListColor) => void;
}

/** Neue Liste (1f): Name und 5 Farbkreise, Grün vorausgewählt; „Erstellen“ bei leerem Namen ausgegraut. */
export function NewListDialog({ isOpen, onClose, onCreate }: NewListDialogProps) {
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size="lg" avoidKeyboard>
      <AlertDialogBackdrop />
      {/* Neu einhängen bei jedem Öffnen → frischer Zustand */}
      {isOpen ? <NewListForm onClose={onClose} onCreate={onCreate} /> : null}
    </AlertDialog>
  );
}

function NewListForm({ onClose, onCreate }: Omit<NewListDialogProps, "isOpen">) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<ListColor>(DEFAULT_LIST_COLOR);
  const canCreate = name.trim().length > 0;

  const create = () => {
    if (canCreate) onCreate(name, color);
  };

  return (
    <AlertDialogContent>
      <Text role="heading" className="text-xl font-extrabold">
        {t("newList.title")}
      </Text>
      <View className="gap-1.5">
        <Text className="text-xs font-bold text-soft">{t("newList.nameLabel")}</Text>
        <Input>
          <InputField
            autoFocus
            value={name}
            onChangeText={setName}
            onSubmitEditing={create}
            returnKeyType="done"
            aria-label={t("newList.nameLabel")}
          />
        </Input>
      </View>
      <ColorSwatchPicker value={color} onChange={setColor} />
      <AlertDialogFooter>
        <Button variant="secondary" onPress={onClose}>
          <ButtonText>{t("common.cancel")}</ButtonText>
        </Button>
        <Button isDisabled={!canCreate} onPress={create}>
          <ButtonText>{t("common.create")}</ButtonText>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
