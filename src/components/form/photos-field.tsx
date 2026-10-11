import { Image } from "expo-image";
import { CameraIcon, ImageIcon, PlusIcon, XIcon, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from "react-native-reorderable-list";

import { PhotoViewer } from "@/components/image-viewer";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverBackdrop, PopoverBody, PopoverContent } from "@/components/ui/popover";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { PRODUCT_IMAGES_MAX } from "@/lib/db/schema";
import { useFieldContext } from "@/lib/form/form-context";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { pickPhotos, takePhoto, type PhotoDraft, type PickPhotosResult } from "@/lib/images";

import { FieldShell } from "./field-shell";

/**
 * Fotos (4d): „+ Foto“ öffnet ein Popover mit Kamera und Galerie, max. 8 Fotos. Das erste ist das
 * Vorschaubild. Langer Druck + Ziehen sortiert um, × löscht, ein Tipp öffnet die Vollbildansicht.
 * Neue Fotos liegen bis zum Speichern im Cache (`PhotoDraft`).
 */
export function PhotosFieldComponent({ productName }: { productName: string }) {
  const field = useFieldContext<PhotoDraft[]>();
  const photos = field.state.value;
  const showToast = useAppToast();
  const [sourceOpen, setSourceOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const remaining = PRODUCT_IMAGES_MAX - photos.length;

  const add = async (pick: () => Promise<PickPhotosResult>) => {
    setSourceOpen(false);
    try {
      const result = await pick();
      if (result.status === "denied") {
        showToast({ title: t("productForm.cameraDenied") });
        return;
      }
      if (result.photos.length > 0) {
        field.handleChange((current) =>
          [...current, ...result.photos].slice(0, PRODUCT_IMAGES_MAX)
        );
      }
    } catch {
      showToast({ title: t("productForm.photoFailed") });
    }
  };

  const reorder = ({ from, to }: ReorderableListReorderEvent) =>
    field.handleChange((current) => reorderItems(current, from, to));

  const remove = (key: string) =>
    field.handleChange((current) => current.filter((photo) => photo.key !== key));

  return (
    <FieldShell label={t("productForm.photos")}>
      <View className="flex-row">
        {remaining > 0 ? (
          <Popover
            isOpen={sourceOpen}
            onOpen={() => setSourceOpen(true)}
            onClose={() => setSourceOpen(false)}
            placement="top left"
            trigger={(triggerProps) => (
              <Pressable
                {...triggerProps}
                role="button"
                aria-label={t("productForm.addPhotoLabel")}
                className="mr-2.5 mt-1.5 size-18 items-center justify-center gap-0.5 rounded-thumb border border-dashed border-soft active:opacity-70"
              >
                <Icon as={PlusIcon} size="lg" className="text-soft" />
                <Text className="text-xs font-bold text-soft">{t("productForm.addPhoto")}</Text>
              </Pressable>
            )}
          >
            <PopoverBackdrop />
            <PopoverContent className="w-60 p-1.5">
              <PopoverBody>
                <SourceItem
                  icon={CameraIcon}
                  label={t("productForm.takePhoto")}
                  onPress={() => add(takePhoto)}
                />
                <SourceItem
                  icon={ImageIcon}
                  label={t("productForm.pickPhotos")}
                  onPress={() => add(() => pickPhotos(remaining))}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ) : null}

        <ReorderableList
          horizontal
          data={photos}
          keyExtractor={(photo) => photo.key}
          onReorder={reorder}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // Fremdkomponente ohne className-Unterstützung
          style={{ flex: 1 }}
          renderItem={({ item, index }) => (
            <PhotoTile
              photo={item}
              index={index}
              onOpen={() => setViewerIndex(index)}
              onRemove={() => remove(item.key)}
            />
          )}
        />
      </View>

      <PhotoViewer
        title={productName}
        uris={photos.map((photo) => photo.uri)}
        initialIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </FieldShell>
  );
}

function SourceItem({
  icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      className="min-h-11 flex-row items-center gap-3 rounded-thumb px-2.5 active:bg-chip"
    >
      <Icon as={icon} size="md" className="text-ink" />
      <Text className="text-base font-bold">{label}</Text>
    </Pressable>
  );
}

interface PhotoTileProps {
  photo: PhotoDraft;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
}

/** Foto-Kachel 72 × 72 mit ×-Knopf oben rechts; langer Druck hebt sie zum Umsortieren an. */
function PhotoTile({ photo, index, onOpen, onRemove }: PhotoTileProps) {
  const drag = useReorderableDrag();

  return (
    <View className="pr-2.5 pt-1.5">
      <Pressable
        onPress={onOpen}
        onLongPress={() => {
          hapticTap();
          drag();
        }}
        delayLongPress={250}
        role="button"
        aria-label={t("productForm.showPhoto", { index: index + 1 })}
      >
        <Image
          source={{ uri: photo.uri }}
          className="size-18 rounded-thumb"
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        role="button"
        aria-label={t("productForm.removePhoto", { index: index + 1 })}
        className="absolute right-1 top-0 size-6 items-center justify-center rounded-[999px] border-2 border-surface bg-ink"
      >
        <Icon as={XIcon} className="h-3 w-3 text-bg" />
      </Pressable>
    </View>
  );
}
