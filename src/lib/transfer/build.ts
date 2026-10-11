import { File, Paths } from "expo-file-system";

import { PRODUCT_IMAGES_DIR } from "@/lib/images";
import { getListItems } from "@/lib/queries/list-items";
import { getListSummary } from "@/lib/queries/lists";
import { getProductImages } from "@/lib/queries/products";

import {
  TRANSFER_FORMAT_VERSION,
  type TransferImages,
  type TransferItem,
  type TransferPayload,
} from "./format";

export type ListTransfer = { payload: TransferPayload; images: TransferImages };

/**
 * Paket einer Liste für Netzwerk-Transfer und Datei-Export: Name, Farbe und alle Einträge mit
 * Produkt, Menge, Einheit und Notiz; je Produkt Kategoriename und Fotos. Haken werden nicht
 * übertragen. Fehlende Fotodateien werden übersprungen.
 */
export async function buildListTransfer(listId: string): Promise<ListTransfer | null> {
  const summary = getListSummary(listId);
  if (!summary) return null;

  const images: TransferImages = new Map();
  const items: TransferItem[] = [];

  for (const item of getListItems(listId)) {
    const refs: TransferItem["product"]["images"] = [];
    for (const fileName of getProductImages(item.productId)) {
      const file = new File(Paths.document, PRODUCT_IMAGES_DIR, fileName);
      if (!file.exists) continue;
      if (!images.has(fileName)) images.set(fileName, await file.bytes());
      // Ohne Hash (sollte nicht vorkommen) zählt der Dateiname – dann gilt das Foto als „anders“
      refs.push({ file: fileName, hash: file.info({ md5: true }).md5 ?? fileName });
    }

    items.push({
      product: {
        name: item.productName,
        category: item.categoryIsSystem ? null : item.categoryName,
        images: refs,
      },
      quantity: item.quantity,
      unit: item.unit,
      note: item.note,
    });
  }

  return {
    payload: {
      formatVersion: TRANSFER_FORMAT_VERSION,
      type: "list",
      list: { name: summary.name, color: summary.color },
      items,
    },
    images,
  };
}
