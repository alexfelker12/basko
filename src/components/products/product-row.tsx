import { EllipsisIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { HighlightedText } from "@/components/highlighted-text";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";
import type { CatalogMatch } from "@/lib/product-search";

interface ProductItemProps {
  match: CatalogMatch;
  /** Tipp auf den Rest: „Produkt bearbeiten“. */
  onPress: () => void;
  /** Tipp aufs Bild: Vollbildansicht (nur mit Foto). */
  onImagePress: () => void;
  onMorePress?: () => void;
  /** Raster (4b) hat kein „···“ – langer Druck öffnet dort die Produkt-Aktionen (4f). */
  onLongPress?: () => void;
}

/** Vorschaubild; mit Foto öffnet ein Tipp die Vollbildansicht, sonst gilt der Tipp der Zeile. */
function Thumbnail({
  match: { product },
  onImagePress,
  size,
}: Pick<ProductItemProps, "match" | "onImagePress"> & { size: "md" | "tile" }) {
  const thumbnail = (
    <ProductThumbnail name={product.name} fileName={product.thumbnailFileName} size={size} />
  );
  if (!product.thumbnailFileName) return thumbnail;

  return (
    <Pressable
      onPress={onImagePress}
      role="button"
      aria-label={t("products.showImages", { name: product.name })}
      className="active:opacity-80"
    >
      {thumbnail}
    </Pressable>
  );
}

/** Zeile in der Liste (4a): Vorschaubild 44 × 44, Name, Kategorie und „···“. */
export function ProductRow({ match, onPress, onImagePress, onMorePress }: ProductItemProps) {
  const { product } = match;

  return (
    // Deckend über die volle Breite: Das Punktraster füllt nur leere Flächen (wie Wisch-Zeilen)
    <View className="bg-bg">
      <Pressable
        onPress={onPress}
        className="mx-page flex-row items-center gap-3.5 border-b border-line py-row active:opacity-70"
      >
        <Thumbnail match={match} onImagePress={onImagePress} size="md" />
        <View className="min-w-0 flex-1">
          <HighlightedText parts={match.parts} className="text-base font-bold" />
          <Text numberOfLines={1} className="mt-0.5 text-xs text-soft">
            {product.categoryName}
          </Text>
        </View>
        <Pressable
          onPress={onMorePress}
          role="button"
          aria-label={t("products.actions", { name: product.name })}
          className="-mr-2.5 size-11 items-center justify-center"
        >
          <Icon as={EllipsisIcon} size="lg" className="text-soft" />
        </Pressable>
      </Pressable>
    </View>
  );
}

/** Kachel im Raster (4b): Foto oder Buchstaben-Platzhalter, Name und Kategorie. */
export function ProductTile({ match, onPress, onImagePress, onLongPress }: ProductItemProps) {
  const { product } = match;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} className="gap-1.5 active:opacity-70">
      <Thumbnail match={match} onImagePress={onImagePress} size="tile" />
      <View>
        <HighlightedText parts={match.parts} className="text-sm font-bold" />
        <Text numberOfLines={1} className="text-xs text-soft">
          {product.categoryName}
        </Text>
      </View>
    </Pressable>
  );
}
