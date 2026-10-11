import { PencilIcon, Trash2Icon } from "lucide-react-native";
import { View } from "react-native";

import { ActionItem } from "@/components/action-item";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/ui/text";
import { useLastDefined } from "@/hooks/use-last-defined";
import { t } from "@/lib/i18n";
import type { CatalogProduct } from "@/lib/queries/products";

interface ProductActionsSheetProps {
  product: CatalogProduct | null;
  onClose: () => void;
  /** Nach jeder Schließ-Animation – das nächste Sheet/den Dialog erst dann öffnen. */
  onClosed: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Produkt-Aktionen (4f): Kopf aus Name und „{Kategorie} · {n} Fotos“, Bearbeiten, Löschen (inkl. Bilder). */
export function ProductActionsSheet({
  product,
  onClose,
  onClosed,
  onEdit,
  onDelete,
}: ProductActionsSheetProps) {
  const shown = useLastDefined(product);

  return (
    <Sheet isOpen={product !== null} onDismiss={onClose} onClosed={onClosed}>
      {shown ? (
        <View className="pb-2">
          <View className="mb-1 flex-row items-center gap-3.5 border-b border-line px-page pb-3.5 pt-1.5">
            <ProductThumbnail name={shown.name} fileName={shown.thumbnailFileName} />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-lg font-extrabold">
                {shown.name}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-xs text-soft">
                {`${shown.categoryName} · ${t("products.imageCount", { count: shown.imageCount })}`}
              </Text>
            </View>
          </View>
          <ActionItem icon={PencilIcon} title={t("productActions.edit")} onPress={onEdit} />
          <ActionItem
            icon={Trash2Icon}
            title={t("productActions.delete")}
            onPress={onDelete}
            danger
          />
        </View>
      ) : null}
    </Sheet>
  );
}
