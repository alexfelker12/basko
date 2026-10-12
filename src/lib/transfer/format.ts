import { Buffer } from "buffer";
import { z } from "zod";

import { LIST_ITEM_NOTE_MAX, PRODUCT_IMAGES_MAX, PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { LIST_COLORS } from "@/lib/list-colors";
import { UNITS } from "@/lib/units";

/**
 * Binärformat für Netzwerk-Transfer und `.basko`-Datei (Spezifikation → 6 „Format“), wie in
 * digi-list: [u32 JSON-Länge][JSON][u32 Anzahl Bilder], je Bild [u32 Namenslänge][Name]
 * [u32 Bytes-Länge][Bytes]. Alle Zahlen Big Endian.
 */
export const TRANSFER_FORMAT_VERSION = 1;

const imageRefSchema = z.object({
  /** Dateiname im Bildteil des Pakets. */
  file: z.string().min(1).max(200),
  /** MD5 der Datei – Vergleich „andere Fotos“ beim Abgleich (6i). */
  hash: z.string().min(1).max(64),
});

const itemSchema = z.object({
  product: z.object({
    name: z.string().trim().min(1).max(PRODUCT_NAME_MAX),
    /** Kategoriename; `null` = Systemkategorie „Sonstiges“ (über `isSystem`, nicht den Namen). */
    category: z.string().trim().min(1).max(200).nullable(),
    images: z.array(imageRefSchema).max(PRODUCT_IMAGES_MAX),
  }),
  quantity: z.number().positive(),
  unit: z.enum(UNITS),
  note: z.string().max(LIST_ITEM_NOTE_MAX).nullable(),
});

const nutritionValue = z.number().nullable();

/**
 * Rezept einer Liste aus 7e (seit Phase 5, optional): Ältere App-Stände ignorieren das Feld
 * (Zod entfernt unbekannte Schlüssel), daher bleibt `formatVersion` 1.
 */
const recipeSchema = z.object({
  title: z.string().trim().min(1).max(500),
  servings: z.string().max(200).nullable(),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(500),
        quantity: z.number().nullable(),
        unit: z.string().max(100).nullable(),
      })
    )
    .max(500),
  instructions: z.array(z.string().max(10_000)).max(500),
  nutrition: z.object({
    calories: nutritionValue,
    protein: nutritionValue,
    carbs: nutritionValue,
    fat: nutritionValue,
  }),
});

const payloadSchema = z.object({
  formatVersion: z.literal(TRANSFER_FORMAT_VERSION),
  type: z.literal("list"),
  list: z.object({
    name: z.string().trim().min(1).max(200),
    color: z.enum(LIST_COLORS),
  }),
  items: z.array(itemSchema),
  recipe: recipeSchema.optional(),
});

export type TransferPayload = z.infer<typeof payloadSchema>;
export type TransferItem = TransferPayload["items"][number];

/** Bilddaten zum Paket, Schlüssel = Dateiname aus `imageRefSchema.file`. */
export type TransferImages = Map<string, Uint8Array>;

export type DecodedTransfer = { payload: TransferPayload; images: TransferImages };

/** Kaputte oder fremde Daten bzw. eine neuere `formatVersion` („Datei konnte nicht gelesen werden“). */
export class TransferFormatError extends Error {
  constructor(
    message: string,
    readonly reason: "corrupt" | "newerVersion" = "corrupt"
  ) {
    super(message);
    this.name = "TransferFormatError";
  }
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
}

export function encodeTransfer(payload: TransferPayload, images: TransferImages): Buffer {
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  const parts: Buffer[] = [u32(json.length), json, u32(images.size)];
  for (const [fileName, bytes] of images) {
    const name = Buffer.from(fileName, "utf8");
    parts.push(u32(name.length), name, u32(bytes.length), Buffer.from(bytes));
  }
  return Buffer.concat(parts);
}

export function decodeTransfer(data: Uint8Array): DecodedTransfer {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  let offset = 0;

  const readU32 = () => {
    if (offset + 4 > buffer.length) throw new TransferFormatError("unexpected end");
    const value = buffer.readUInt32BE(offset);
    offset += 4;
    return value;
  };
  const readBytes = (length: number): Uint8Array => {
    if (offset + length > buffer.length) throw new TransferFormatError("unexpected end");
    const slice = buffer.subarray(offset, offset + length);
    offset += length;
    return slice;
  };
  const readString = (length: number) => {
    const start = offset;
    readBytes(length);
    return buffer.toString("utf8", start, start + length);
  };

  let raw: unknown;
  try {
    raw = JSON.parse(readString(readU32()));
  } catch (error) {
    if (error instanceof TransferFormatError) throw error;
    throw new TransferFormatError("invalid json");
  }

  // Neuere Version erkennen, bevor das Schema greift – eigener Hinweis statt „kaputt“
  const version = (raw as { formatVersion?: unknown } | null)?.formatVersion;
  if (typeof version === "number" && version > TRANSFER_FORMAT_VERSION) {
    throw new TransferFormatError("newer format", "newerVersion");
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) throw new TransferFormatError("invalid payload");

  const images: TransferImages = new Map();
  const count = readU32();
  for (let index = 0; index < count; index++) {
    const fileName = readString(readU32());
    // Kopie: die Bytes überleben so den (großen) Empfangspuffer
    images.set(fileName, Uint8Array.from(readBytes(readU32())));
  }

  return { payload: parsed.data, images };
}
