import { File, Paths } from "expo-file-system";

/** Ordner der Produktfotos im Dokumente-Ordner der App (Fotos kommen mit Phase 3). */
export const PRODUCT_IMAGES_DIR = "product-images";

export function productImageUri(fileName: string): string {
  return new File(Paths.document, PRODUCT_IMAGES_DIR, fileName).uri;
}
