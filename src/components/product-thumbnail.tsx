import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { productImageUri } from "@/lib/images";

interface ProductThumbnailProps {
  name: string;
  fileName: string | null;
}

/** Vorschaubild 44 × 44, Radius 10: erstes Foto, sonst Anfangsbuchstabe auf `chip`. */
export function ProductThumbnail({ name, fileName }: ProductThumbnailProps) {
  if (fileName) {
    return (
      <Image
        source={{ uri: productImageUri(fileName) }}
        className="size-11 rounded-thumb"
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View className="size-11 items-center justify-center rounded-thumb bg-chip">
      <Text className="text-base font-extrabold text-soft">
        {Array.from(name.trim())[0]?.toLocaleUpperCase("de") ?? ""}
      </Text>
    </View>
  );
}
