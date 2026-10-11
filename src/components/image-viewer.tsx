import { StatusBar } from "expo-status-bar";
import { XIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";

import { Icon } from "@/components/ui/icon";
import { ImageViewer, ImageViewerContent, useImageViewer } from "@/components/ui/image-viewer";
import { Text } from "@/components/ui/text";
import { useProductImages } from "@/hooks/use-catalog";
import { t } from "@/lib/i18n";
import { productImageUri } from "@/lib/images";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Abstand zwischen Bildfläche und Kopf bzw. Fuß. */
const CHROME_GAP = 8;

interface PhotoViewerProps {
  /** Produktname im Kopf. */
  title: string;
  uris: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Vollbildansicht (4c) auf Basis des gluestack Image Viewer: Name, Zähler „1 / 2“, Zoomen mit
 * zwei Fingern, Doppeltipp, Wischen zwischen Fotos; schließen mit ✕ oder Wischen nach unten.
 * Wird bei jedem Öffnen neu eingehängt, damit `initialIndex` greift.
 */
export function PhotoViewer({ title, uris, initialIndex = 0, isOpen, onClose }: PhotoViewerProps) {
  // Höhe von Kopf und Fuß (inkl. Safe Area) – die Bildfläche liegt dazwischen und ragt nicht hinein
  const [chrome, setChrome] = useState({ top: 0, bottom: 0 });

  if (!isOpen || uris.length === 0) return null;

  return (
    <ImageViewer
      images={uris.map((url) => ({ url, alt: title }))}
      initialIndex={Math.min(initialIndex, uris.length - 1)}
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ImageViewerContent
        insetTop={chrome.top + CHROME_GAP}
        insetBottom={chrome.bottom + CHROME_GAP}
      >
        <StatusBar style="light" />
        <ViewerChrome
          title={title}
          onHeaderLayout={(event) =>
            setChrome((current) => ({ ...current, top: event.nativeEvent.layout.height }))
          }
          onFooterLayout={(event) =>
            setChrome((current) => ({ ...current, bottom: event.nativeEvent.layout.height }))
          }
        />
      </ImageViewerContent>
    </ImageViewer>
  );
}

/** Kopf (✕, Name, Zähler) und Fuß (Punkte, Hinweis) über dem Bild. */
function ViewerChrome({
  title,
  onHeaderLayout,
  onFooterLayout,
}: {
  title: string;
  onHeaderLayout: (event: LayoutChangeEvent) => void;
  onFooterLayout: (event: LayoutChangeEvent) => void;
}) {
  const { currentIndex, images, close } = useImageViewer();

  return (
    <>
      <View
        className="absolute left-0 right-0 top-0 pt-safe"
        pointerEvents="box-none"
        onLayout={onHeaderLayout}
      >
        <View className="h-15 flex-row items-center gap-3 px-page">
          <Pressable
            onPress={close}
            role="button"
            aria-label={t("imageViewer.close")}
            className="size-11 items-center justify-center rounded-[999px] bg-white/15 active:opacity-70"
          >
            <Icon as={XIcon} size="lg" className="text-white" />
          </Pressable>
          <Text numberOfLines={1} className="flex-1 text-lg font-extrabold text-white">
            {title}
          </Text>
          {images.length > 1 ? (
            <Text className="text-sm font-bold text-white/70">
              {t("imageViewer.counter", { index: currentIndex + 1, count: images.length })}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 pb-safe"
        pointerEvents="none"
        onLayout={onFooterLayout}
      >
        <View className="items-center gap-3 pb-6">
          {images.length > 1 ? (
            <View className="flex-row gap-1.5">
              {images.map((image, index) => (
                <View
                  key={`${index}-${image.url}`}
                  className={cn(
                    "size-1.75 rounded-[999px]",
                    index === currentIndex ? "bg-white" : "bg-white/35"
                  )}
                />
              ))}
            </View>
          ) : null}
          <Text className="text-xs font-semibold text-white/70">{t("imageViewer.zoomHint")}</Text>
        </View>
      </View>
    </>
  );
}

interface ProductPhotoViewerProps {
  /** Produkt, dessen Fotos gezeigt werden; `null` = geschlossen. */
  product: { id: string; name: string } | null;
  onClose: () => void;
}

/** Vollbildansicht für ein gespeichertes Produkt (Produkte-Tab, Einkaufsmodus): lädt die Fotos selbst. */
export function ProductPhotoViewer({ product, onClose }: ProductPhotoViewerProps) {
  const { data: fileNames = [] } = useProductImages(product?.id ?? null);

  return (
    <PhotoViewer
      key={product?.id}
      title={product?.name ?? ""}
      uris={fileNames.map(productImageUri)}
      isOpen={product !== null}
      onClose={onClose}
    />
  );
}
