import { Image as ExpoImage } from "expo-image";
import { styled } from "nativewind";

/**
 * Basko: expo-image mit `className`. NativeWind bildet `className` nur bei React-Native-Kern-
 * komponenten auf `style` ab – ein nacktes `<ExpoImage className="size-11" />` bekam keine Größe
 * und blieb unsichtbar (0 × 0).
 */
export const Image = styled(ExpoImage, { className: "style" });
