import { router } from "expo-router";
import { useEffect } from "react";

import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRestoreBackup } from "@/hooks/use-backup";
import { useLastDefined } from "@/hooks/use-last-defined";
import {
  clearRestore,
  clearRestoreError,
  useRestoreState,
  type RestoreError,
} from "@/lib/backup/session";
import { formatDate, t } from "@/lib/i18n";

function errorTitle(error: RestoreError): string {
  return error === "newerVersion" ? t("backup.newerVersion") : t("transfer.fileUnreadable");
}

/**
 * „Daten ersetzen?“ (8e) – einmal im Root-Layout, damit der Dialog auch erscheint, wenn eine
 * `.baskobackup`-Datei von außen geöffnet wird. Nach dem Ersetzen: Listen-Tab und Toast
 * „Daten wiederhergestellt“. Lesefehler von außen geöffneter Dateien erscheinen als Toast.
 */
export function RestoreHost() {
  const { pending, error } = useRestoreState();
  const shown = useLastDefined(pending);
  const showToast = useAppToast();
  const restore = useRestoreBackup();

  useEffect(() => {
    if (!error) return;
    showToast({ title: errorTitle(error) });
    clearRestoreError();
  }, [error, showToast]);

  const close = () => {
    if (pending && !restore.isPending) clearRestore(pending.id);
  };

  const confirm = () => {
    if (!pending || restore.isPending) return;
    restore.mutate(pending.backup, {
      onSuccess: () => {
        clearRestore(pending.id);
        router.dismissTo("/");
        showToast({ title: t("backup.restored"), withCheck: true });
      },
      onError: (restoreError) => {
        console.warn("[backup] restore", restoreError);
        showToast({ title: t("errors.generic") });
      },
    });
  };

  return (
    <Dialog isOpen={pending !== null} onClose={close} closeOnOverlayClick={false}>
      {shown ? (
        <>
          <Text role="heading" className="text-xl font-extrabold">
            {t("backup.restoreDialog.title")}
          </Text>
          <Text className="text-sm text-soft">
            {t("backup.restoreDialog.text", {
              date: formatDate(shown.backup.payload.createdAt),
            })}
          </Text>
          <AlertDialogFooter>
            <Button variant="secondary" onPress={close} isDisabled={restore.isPending}>
              <ButtonText>{t("common.cancel")}</ButtonText>
            </Button>
            <Button variant="destructive" onPress={confirm} isDisabled={restore.isPending}>
              {restore.isPending ? <ButtonSpinner className="text-white" /> : null}
              <ButtonText>{t("backup.restoreDialog.confirm")}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </>
      ) : null}
    </Dialog>
  );
}
