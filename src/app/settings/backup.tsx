import { DownloadIcon, UploadIcon } from "lucide-react-native";
import { View } from "react-native";

import { ScreenPattern } from "@/components/screen-pattern";
import { SettingsRow } from "@/components/settings/settings-row";
import { StackHeader } from "@/components/stack-header";
import { useAppToast } from "@/hooks/use-app-toast";
import { useExportBackup, usePickBackup } from "@/hooks/use-backup";
import { reportRestoreError, restoreErrorOf } from "@/lib/backup/session";
import { t } from "@/lib/i18n";

/**
 * Daten & Sicherung (8c): „Sichern“ teilt eine `.baskobackup`-Datei (Toast 8d, sobald das
 * Teilen-Menü zu ist), „Wiederherstellen“ wählt eine Datei und führt zu „Daten ersetzen?“ (8e).
 */
export default function BackupScreen() {
  const showToast = useAppToast();
  const exportBackup = useExportBackup();
  const pickBackup = usePickBackup();

  const create = () => {
    if (exportBackup.isPending) return;
    exportBackup.mutate(undefined, {
      onSuccess: () => showToast({ title: t("backup.created"), withCheck: true }),
      onError: (error) => {
        console.warn("[backup] create", error);
        showToast({ title: t("errors.generic") });
      },
    });
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

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <StackHeader title={t("backup.title")} />
      <View className="mx-page border-t border-line">
        <SettingsRow
          icon={UploadIcon}
          title={t("backup.create.title")}
          subtitle={t("backup.create.text")}
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
      </View>
    </View>
  );
}
