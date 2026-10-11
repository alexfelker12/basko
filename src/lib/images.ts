import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { newId } from "@/lib/db/id";

/** Ordner der Produktfotos im Dokumente-Ordner der App. */
export const PRODUCT_IMAGES_DIR = "product-images";

/** Fotos werden auf ca. 1280 px lange Kante verkleinert und als JPEG 80 % gespeichert (4d). */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.8;

function imagesDirectory(): Directory {
  const directory = new Directory(Paths.document, PRODUCT_IMAGES_DIR);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

export function productImageUri(fileName: string): string {
  return new File(Paths.document, PRODUCT_IMAGES_DIR, fileName).uri;
}

/**
 * Foto im Produkt-Formular: vorhandene Fotos tragen ihren Dateinamen, neu gewählte liegen bis
 * zum Speichern im Cache (`fileName = null`). `key` ist stabil (Umsortieren, Listen-Keys).
 */
export type PhotoDraft = { key: string; uri: string; fileName: string | null };

export function photoDraftsFromFiles(fileNames: string[]): PhotoDraft[] {
  return fileNames.map((fileName) => ({ key: fileName, uri: productImageUri(fileName), fileName }));
}

/** Verkleinert ein gewähltes Foto (lange Kante max. 1280 px, JPEG 80 %). Das Ergebnis liegt im Cache. */
async function preparePhoto(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const longEdge = Math.max(original.width, original.height);
  const image =
    longEdge > MAX_EDGE
      ? await ImageManipulator.manipulate(original)
          .resize(original.width >= original.height ? { width: MAX_EDGE } : { height: MAX_EDGE })
          .renderAsync()
      : original;
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}

async function toDrafts(result: ImagePicker.ImagePickerResult): Promise<PhotoDraft[]> {
  if (result.canceled) return [];
  const uris = await Promise.all(result.assets.map((asset) => preparePhoto(asset.uri)));
  return uris.map((uri) => ({ key: newId(), uri, fileName: null }));
}

export type PickPhotosResult = { status: "ok"; photos: PhotoDraft[] } | { status: "denied" };

/** „Foto aufnehmen“ (4d). Fragt nach der Kamera-Berechtigung. */
export async function takePhoto(): Promise<PickPhotosResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: "denied" };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
  return { status: "ok", photos: await toDrafts(result) };
}

/** „Aus Galerie auswählen“ (4d), mehrere auf einmal bis zur Obergrenze. */
export async function pickPhotos(limit: number): Promise<PickPhotosResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    orderedSelection: true,
    quality: 1,
  });
  return { status: "ok", photos: (await toDrafts(result)).slice(0, limit) };
}

/** Übernimmt neu gewählte Fotos aus dem Cache in den Fotoordner; liefert die Dateinamen in Reihenfolge. */
export function storePhotoDrafts(photos: PhotoDraft[]): string[] {
  const directory = imagesDirectory();
  return photos.map((photo) => {
    if (photo.fileName) return photo.fileName;
    const fileName = `${newId()}.jpg`;
    new File(photo.uri).moveSync(new File(directory, fileName));
    return fileName;
  });
}

/** Löscht Fotodateien; fehlende Dateien werden ignoriert. */
export function deleteProductImageFiles(fileNames: Iterable<string>) {
  for (const fileName of fileNames) {
    try {
      const file = new File(Paths.document, PRODUCT_IMAGES_DIR, fileName);
      if (file.exists) file.delete();
    } catch {
      // Eine liegen gebliebene Datei schadet nicht – das Produkt ist trotzdem gelöscht
    }
  }
}
