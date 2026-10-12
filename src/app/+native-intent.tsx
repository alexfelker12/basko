import { parseBackup } from "@/lib/backup/format";
import { openRestore, reportRestoreError, restoreErrorOf } from "@/lib/backup/session";
import { readFileBytes } from "@/lib/transfer/file";
import { containerType, decodeContainer, parseTransfer } from "@/lib/transfer/format";
import { notifyFileUnreadable, openFileImport } from "@/lib/transfer/session";

/**
 * Von außen geöffnete Dateien: Android liefert sie per Intent als `content://`/`file://`, iOS als
 * `file://`. Beide Dateitypen teilen sich den Container, der Typ im Kopf entscheidet:
 * - `.basko` (Datei-Export und -Import) → Transfer-Tab mit der Vorschau (6h)
 * - `.baskobackup` (8e) → „Daten ersetzen?“ über dem aktuellen Screen, beim Kaltstart über den Listen
 *
 * `null` heißt: bleiben, wo man ist. Fehler werden nie geworfen (sonst stürzt der Router ab),
 * sondern als Toast gemeldet.
 */
const FILE_URI = /^(content|file):\/\//i;

export async function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): Promise<string | null> {
  if (!FILE_URI.test(path)) return path;
  const stay = initial ? "/" : null;

  let container;
  try {
    container = decodeContainer(await readFileBytes(path));
  } catch (error) {
    console.warn("[file] open", error);
    notifyFileUnreadable();
    return stay;
  }

  if (containerType(container.raw) === "backup") {
    try {
      openRestore(parseBackup(container));
    } catch (error) {
      console.warn("[backup] open", error);
      reportRestoreError(restoreErrorOf(error));
    }
    return stay;
  }

  try {
    openFileImport(parseTransfer(container));
  } catch (error) {
    console.warn("[transfer] file import", error);
    notifyFileUnreadable();
    return stay;
  }
  return "/transfer";
}
