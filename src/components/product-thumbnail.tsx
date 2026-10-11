import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { productImageUri } from "@/lib/images";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface ProductThumbnailProps {
  name: string;
  fileName: string | null;
  /** `md` = 44 × 44 (Zeilen), `tile` = quadratisch über die volle Breite (Raster 4b). */
  size?: "md" | "tile";
}

/** Vorschaubild mit Radius 10: erstes Foto, sonst Anfangsbuchstabe auf `chip`. */
export function ProductThumbnail({ name, fileName, size = "md" }: ProductThumbnailProps) {
  const boxClass = size === "tile" ? "aspect-square w-full rounded-thumb" : "size-11 rounded-thumb";

  if (fileName) {
    return (
      <Image
        source={{ uri: productImageUri(fileName) }}
        className={boxClass}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View className={cn("items-center justify-center bg-chip", boxClass)}>
      <Text className={cn("font-extrabold text-soft", size === "tile" ? "text-2xl" : "text-base")}>
        {Array.from(name.trim())[0]?.toLocaleUpperCase("de") ?? ""}
      </Text>
    </View>
  );
}
