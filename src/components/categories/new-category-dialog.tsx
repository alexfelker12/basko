import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useCategories } from "@/hooks/use-categories";
import { CATEGORY_NAME_MAX } from "@/lib/db/schema";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import { isNameTaken } from "@/lib/names";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation";

/**
 * Prüft einen Kategorienamen gegen die vorhandenen (ohne Beachtung der Groß-/Kleinschreibung):
 * Fehlertext unter dem Feld, Absenden ausgegraut (5a, 5c).
 */
export function categoryNameValidator(names: string[]) {
  return ({ value }: { value: string }) =>
    isNameTaken(value, names) ? t("categoryForm.nameTaken") : undefined;
}

interface NewCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

/** Neue Kategorie (5c): Name, Abbrechen und Erstellen. Eingefügt wird am Ende, vor „Sonstiges“. */
export function NewCategoryDialog({ isOpen, onClose, onCreate }: NewCategoryDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <NewCategoryForm onClose={onClose} onCreate={onCreate} />
    </Dialog>
  );
}

function NewCategoryForm({ onClose, onCreate }: Omit<NewCategoryDialogProps, "isOpen">) {
  const { data: categories = [] } = useCategories();
  const names = categories.map((category) => category.name);

  const form = useAppForm({
    defaultValues: { name: "" } as CategoryFormValues,
    validators: { onMount: categoryFormSchema, onChange: categoryFormSchema },
    onSubmit: ({ value }) => onCreate(value.name.trim()),
  });

  return (
    <>
      <Text role="heading" className="text-xl font-extrabold">
        {t("categoryForm.newTitle")}
      </Text>
      <form.AppField name="name" validators={{ onChange: categoryNameValidator(names) }}>
        {(field) => (
          <field.TextField
            label={t("categoryForm.name")}
            autoFocus
            maxLength={CATEGORY_NAME_MAX}
            returnKeyType="done"
            onSubmitEditing={() => form.handleSubmit()}
          />
        )}
      </form.AppField>
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
