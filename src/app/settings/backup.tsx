import { DownloadIcon, FolderIcon, UploadIcon } from "lucide-react-native";
import { Platform, View } from "react-native";

import { ScreenPattern } from "@/components/screen-pattern";
import { SettingsRow } from "@/components/settings/settings-row";
import { StackHeader } from "@/components/stack-header";
import { useAppToast } from "@/hooks/use-app-toast";
import { useChooseBackupDirectory, useExportBackup, usePickBackup } from "@/hooks/use-backup";
import { useSettings } from "@/hooks/use-settings";
import { backupFolderName } from "@/lib/backup/create";
import { reportRestoreError, restoreErrorOf } from "@/lib/backup/session";
import { t } from "@/lib/i18n";

/** Android speichert direkt in einen gewählten Ordner, iOS teilt („In Dateien sichern“). */
const SAVES_TO_FOLDER = Platform.OS === "android";

/**
 * Daten & Sicherung (8c): „Sichern“ legt eine `.baskobackup`-Datei ab (Toast 8d),
 * „Wiederherstellen“ wählt eine Datei und führt zu „Daten ersetzen?“ (8e). Auf Android zusätzlich
 * „Speicherort“: der Ordner, in den „Sichern“ schreibt.
 */
export default function BackupScreen() {
  const showToast = useAppToast();
  const { backupDirectory } = useSettings();
  const exportBackup = useExportBackup();
  const chooseDirectory = useChooseBackupDirectory();
  const pickBackup = usePickBackup();

  const showError = (scope: string) => (error: Error) => {
    console.warn(`[backup] ${scope}`, error);
    showToast({ title: t("errors.generic") });
  };

  const create = () => {
    if (exportBackup.isPending) return;
    exportBackup.mutate(undefined, {
      onSuccess: (result) => {
        if (result.kind === "cancelled") return;
        const title =
          result.kind === "saved" && result.folder
            ? t("backup.savedTo", { folder: result.folder })
            : t("backup.created");
        showToast({ title, withCheck: true });
      },
      onError: showError("create"),
    });
  };

  const chooseLocation = () => {
    if (chooseDirectory.isPending) return;
    chooseDirectory.mutate(undefined, { onError: showError("location") });
  };

  const restore = () => {
    if (pickBackup.isPending) return;
    pickBackup.mutate(undefined, {
      onError: (error) => {
        console.warn("[backup] read", error);
        reportRestoreError(restoreErrorOf(error));
      },
    });
  };

  const location = backupDirectory
    ? (backupFolderName(backupDirectory) ?? t("backup.location.root"))
    : t("backup.location.unset");

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <StackHeader title={t("backup.title")} />
      <View className="mx-page border-t border-line">
        <SettingsRow
          icon={UploadIcon}
          title={t("backup.create.title")}
          subtitle={SAVES_TO_FOLDER ? t("backup.create.textSave") : t("backup.create.text")}
          onPress={create}
          busy={exportBackup.isPending}
        />
        <SettingsRow
          icon={DownloadIcon}
          title={t("backup.restore.title")}
          subtitle={t("backup.restore.text")}
          onPress={restore}
          busy={pickBackup.isPending}
        />
        {SAVES_TO_FOLDER ? (
          <SettingsRow
            icon={FolderIcon}
            title={t("backup.location.title")}
            subtitle={location}
            onPress={chooseLocation}
            busy={chooseDirectory.isPending}
          />
        ) : null}
      </View>
    </View>
  );
}
