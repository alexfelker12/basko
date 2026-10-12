import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";

import { settingsQueryKey } from "@/hooks/use-settings";
import { exportBackupFile } from "@/lib/backup/create";
import type { DecodedBackup } from "@/lib/backup/format";
import { readBackupFile, restoreBackup } from "@/lib/backup/restore";
import { openRestore } from "@/lib/backup/session";
import type { Settings } from "@/lib/settings";

/** „Sichern“ (8c): Datei bauen und teilen; fertig, sobald das Teilen-Menü zu ist (8d). */
export function useExportBackup() {
  return useMutation({ mutationFn: exportBackupFile });
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
