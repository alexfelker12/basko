import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import { DEVICE_NAME_MAX } from "@/lib/settings";
import { deviceNameFormSchema, type DeviceNameFormValues } from "@/lib/validation";

interface DeviceNameDialogProps {
  isOpen: boolean;
  /** Aktueller Name, mit dem das Feld vorbelegt ist. */
  name: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

/** Gerätename (8b): Erklärung, Eingabefeld (nicht leer, max. 30 Zeichen), Abbrechen und Speichern. */
export function DeviceNameDialog({ isOpen, name, onClose, onSave }: DeviceNameDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DeviceNameForm name={name} onClose={onClose} onSave={onSave} />
    </Dialog>
  );
}

function DeviceNameForm({ name, onClose, onSave }: Omit<DeviceNameDialogProps, "isOpen">) {
  const form = useAppForm({
    defaultValues: { name } as DeviceNameFormValues,
    validators: { onMount: deviceNameFormSchema, onChange: deviceNameFormSchema },
    onSubmit: ({ value }) => onSave(value.name.trim()),
  });

  return (
    <>
      <Text role="heading" className="text-xl font-extrabold">
        {t("deviceNameDialog.title")}
      </Text>
      <Text className="text-sm text-soft">{t("deviceNameDialog.text")}</Text>
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            accessibilityLabel={t("deviceNameDialog.input")}
            autoFocus
            selectTextOnFocus
            maxLength={DEVICE_NAME_MAX}
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
          <form.SubmitButton label={t("deviceNameDialog.save")} />
        </form.AppForm>
      </AlertDialogFooter>
    </>
  );
}
