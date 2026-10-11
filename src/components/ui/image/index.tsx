import { Image as ExpoImage } from "expo-image";
import { styled } from "nativewind";
import type { ComponentProps } from "react";

/**
 * Basko: expo-image mit `className`. NativeWind bildet `className` nur bei React-Native-Kern-
 * komponenten auf `style` ab – ein nacktes `<ExpoImage className="size-11" />` bekam keine Größe
 * und blieb unsichtbar (0 × 0).
 */
const StyledExpoImage = styled(ExpoImage, { className: "style" });

/**
 * Standardwerte gegen Aufblitzen: Ändert sich eine Liste (Suche, Filter-Chips), hängen Zellen
 * Bilder neu ein. Mit `memory-disk` kommen sie sofort aus dem Speicher statt neu von der Platte,
 * ohne Überblendung.
 */
export function Image(props: ComponentProps<typeof StyledExpoImage>) {
  return <StyledExpoImage cachePolicy="memory-disk" transition={0} {...props} />;
}
