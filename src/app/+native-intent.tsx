import { readTransferFile } from "@/lib/transfer/file";
import { notifyFileUnreadable, openFileImport } from "@/lib/transfer/session";

/**
 * Geöffnete `.basko`-Dateien (Spezifikation → Datei-Export und -Import): Android liefert sie per
 * Intent als `content://`/`file://`, iOS als `file://`. Die Datei wird im Hintergrund gelesen,
 * Basko wechselt sofort in den Transfer-Tab und zeigt dort die Vorschau (6h).
 */
const FILE_URI = /^(content|file):\/\//i;

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (!FILE_URI.test(path)) return path;

  readTransferFile(path)
    .then(openFileImport)
    .catch((error: unknown) => {
      console.warn("[transfer] file import", error);
      notifyFileUnreadable();
    });
  return "/transfer";
}
