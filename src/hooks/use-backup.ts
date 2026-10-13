import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

import { settingsQueryKey, useSettings, useUpdateSetting } from "@/hooks/use-settings";
import {
  backupFolderName,
  pickBackupDirectory,
  saveBackupFile,
  shareBackupFile,
  usableBackupDirectory,
} from "@/lib/backup/create";
import type { DecodedBackup } from "@/lib/backup/format";
import { readBackupFile, restoreBackup } from "@/lib/backup/restore";
import { openRestore } from "@/lib/backup/session";
import type { Settings } from "@/lib/settings";

export type BackupExportResult =
  { kind: "saved"; folder: string | null } | { kind: "shared" } | { kind: "cancelled" };

/**
 * „Sichern“ (8c). Android: direkt in den gemerkten Ordner; gibt es keinen (oder ist er weg), erst
 * die Ordnerauswahl – abbrechen = `cancelled`. iOS: Teilen-Menü („In Dateien sichern“), fertig,
 * sobald es zu ist. Danach der Toast (8d).
 */
export function useExportBackup() {
  const { backupDirectory } = useSettings();
  const updateSetting = useUpdateSetting();

  return useMutation({
    mutationFn: async (): Promise<BackupExportResult> => {
      if (Platform.OS !== "android") {
        await shareBackupFile();
        return { kind: "shared" };
      }
      let directory = usableBackupDirectory(backupDirectory);
      if (!directory) {
        directory = await pickBackupDirectory(backupDirectory);
        if (!directory) return { kind: "cancelled" };
        await updateSetting.mutateAsync({ key: "backupDirectory", value: directory.uri });
      }
      await saveBackupFile(directory);
      return { kind: "saved", folder: backupFolderName(directory.uri) };
    },
  });
}

/** „Speicherort“ (8c, nur Android): anderen Ordner für die Sicherungen wählen. */
export function useChooseBackupDirectory() {
  const { backupDirectory } = useSettings();
  const updateSetting = useUpdateSetting();

  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const directory = await pickBackupDirectory(backupDirectory);
      if (!directory) return false;
      await updateSetting.mutateAsync({ key: "backupDirectory", value: directory.uri });
      return true;
    },
  });
}

/**
 * „Wiederherstellen“ (8c → 8e): Datei wählen (`expo-document-picker`) und lesen; danach wartet
 * sie im Restore-Store auf „Daten ersetzen?“. Abbrechen der Auswahl = `false`.
 */
export function usePickBackup() {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const result = await DocumentPicker.getDocumentAsync({
        // Eigene MIME-Typen kennen die wenigsten Dateimanager – geprüft wird der Inhalt
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return false;
      openRestore(await readBackupFile(result.assets[0].uri));
      return true;
    },
  });
}

/**
 * Ersetzt alle Daten durch die Sicherung (8e) und lädt danach alles neu: Einstellungen (das
 * Thema wirkt über den Cache sofort, siehe Root-Layout) und sämtliche Abfragen.
 */
export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (backup: DecodedBackup) => restoreBackup(backup),
    onSuccess: (restored) => {
      const previous = queryClient.getQueryData<Settings>(settingsQueryKey);
      if (previous)
        queryClient.setQueryData<Settings>(settingsQueryKey, { ...previous, ...restored });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== settingsQueryKey[0],
      });
    },
  });
}
