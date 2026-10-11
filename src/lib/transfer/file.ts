import { Directory, File, Paths } from "expo-file-system";
import { copyAsync } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { addTransferHistory } from "@/lib/queries/transfer-history";

import { buildListTransfer } from "./build";
import { decodeTransfer, encodeTransfer, type DecodedTransfer } from "./format";

/** Datei-Export und -Import (Spezifikation → Datei-Export und -Import). */
export const BASKO_FILE_EXTENSION = ".basko";
export const BASKO_MIME_TYPE = "application/x-basko";
export const BASKO_UTI = "com.alexfelker.basko.list";

const EXPORT_DIR = "basko-export";
const IMPORT_DIR = "basko-import";

/** Dateiname aus dem Listennamen: Zeichen, die Dateisysteme nicht mögen, werden zu „-“. */
export function exportFileName(listName: string): string {
  const safe = listName
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  return `${safe || "Liste"}${BASKO_FILE_EXTENSION}`;
}

/** Ordner im Cache leeren bzw. anlegen – alte Export-/Import-Dateien bleiben nicht liegen. */
function freshCacheDirectory(name: string): Directory {
  const directory = new Directory(Paths.cache, name);
  if (directory.exists) directory.delete();
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/**
 * „Als Datei exportieren“: schreibt `{Listenname}.basko` in den Cache und öffnet das
 * Teilen-Menü. Danach entsteht ein Verlaufseintrag „exportiert“. `false`, wenn es die Liste
 * nicht (mehr) gibt.
 */
export async function exportListFile(listId: string): Promise<boolean> {
  const transfer = await buildListTransfer(listId);
  if (!transfer) return false;

  const file = new File(
    freshCacheDirectory(EXPORT_DIR),
    exportFileName(transfer.payload.list.name)
  );
  file.create({ overwrite: true });
  file.write(encodeTransfer(transfer.payload, transfer.images));

  await Sharing.shareAsync(file.uri, {
    mimeType: BASKO_MIME_TYPE,
    UTI: BASKO_UTI,
    dialogTitle: transfer.payload.list.name,
  });

  addTransferHistory({ direction: "exported", listId, listName: transfer.payload.list.name });
  return true;
}

/**
 * Liest eine geöffnete `.basko`-Datei (`file://` oder `content://`). Wirft bei kaputten oder
 * fremden Dateien bzw. einer neueren `formatVersion`.
 */
export async function readTransferFile(uri: string): Promise<DecodedTransfer> {
  let bytes: Uint8Array;
  try {
    bytes = await new File(uri).bytes();
  } catch {
    // Manche Anbieter (`content://`) lassen sich nur kopieren – wie in digi-list über die alte API
    const copy = new File(freshCacheDirectory(IMPORT_DIR), `import${BASKO_FILE_EXTENSION}`);
    await copyAsync({ from: uri, to: copy.uri });
    bytes = await copy.bytes();
  }
  return decodeTransfer(bytes);
}
