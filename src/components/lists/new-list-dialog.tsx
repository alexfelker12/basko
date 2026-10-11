import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import { DEFAULT_LIST_COLOR } from "@/lib/list-colors";
import { listFormSchema, type ListFormValues } from "@/lib/validation";

interface NewListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (values: ListFormValues) => void;
}

/** Neue Liste (1f): Name und 5 Farbkreise, Grün vorausgewählt; „Erstellen“ bei leerem Namen ausgegraut. */
export function NewListDialog({ isOpen, onClose, onCreate }: NewListDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <NewListForm onClose={onClose} onCreate={onCreate} />
    </Dialog>
  );
}

function NewListForm({ onClose, onCreate }: Omit<NewListDialogProps, "isOpen">) {
  const form = useAppForm({
    defaultValues: { name: "", color: DEFAULT_LIST_COLOR } as ListFormValues,
    validators: { onMount: listFormSchema, onChange: listFormSchema },
    onSubmit: ({ value }) => onCreate(value),
  });

  return (
    <>
      <Text role="heading" className="text-xl font-extrabold">
        {t("newList.title")}
      </Text>
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            label={t("newList.nameLabel")}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => form.handleSubmit()}
          />
        )}
      </form.AppField>
      <form.AppField name="color">{(field) => <field.ColorField />}</form.AppField>
      <AlertDialogFooter>
        <Button variant="secondary" onPress={onClose}>
          <ButtonText>{t("common.cancel")}</ButtonText>
        </Button>
        <form.AppForm>
          <form.SubmitButton label={t("common.create")} />
        </form.AppForm>
      </AlertDialogFooter>
    </>
  );
}
