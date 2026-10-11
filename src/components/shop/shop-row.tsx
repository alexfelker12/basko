import { CheckIcon, ChevronDownIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { QuantityChip } from "@/components/quantity-chip";
import { RoundCheckbox } from "@/components/round-checkbox";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatQuantityWithUnit } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { ListItemRow } from "@/lib/queries/list-items";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/**
 * Zeile im Einkaufsmodus (2a): runder Haken, Vorschaubild, Name, Mengen-Chip; Notiz mehrzeilig
 * unter dem Namen. Erledigt: Name durchgestrichen, Name und Chip mit 45 % Deckkraft.
 */
interface ShopRowProps {
  item: ListItemRow;
  onToggle: () => void;
  /** Tipp aufs Vorschaubild: Vollbildansicht (4c), nur mit Foto. */
  onShowImage: () => void;
}

export function ShopRow({ item, onToggle, onShowImage }: ShopRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      role="checkbox"
      aria-checked={item.checked}
      aria-label={item.productName}
      className="mx-page flex-row items-center gap-3.5 border-b border-line py-row"
    >
      <RoundCheckbox checked={item.checked} />
      {item.thumbnailFileName ? (
        <Pressable
          onPress={onShowImage}
          role="button"
          aria-label={t("shop.showImage", { name: item.productName })}
          className="active:opacity-80"
        >
          <ProductThumbnail name={item.productName} fileName={item.thumbnailFileName} />
        </Pressable>
      ) : (
        <ProductThumbnail name={item.productName} fileName={null} />
      )}
      <View className={cn("min-w-0 flex-1", item.checked && "opacity-45")}>
        <Text className={cn("text-base font-bold", item.checked && "line-through")}>
          {item.productName}
        </Text>
        {item.note ? <Text className="mt-0.5 text-sm text-soft">{item.note}</Text> : null}
      </View>
      <QuantityChip label={formatQuantityWithUnit(item.quantity, item.unit)} dimmed={item.checked} />
    </Pressable>
  );
}

interface CollapsedCategoryProps {
  name: string;
  done: number;
  total: number;
  onExpand: () => void;
}

/** Zugeklappte Kategorie (2a): „✓ KÜHLREGAL · 2/2 ⌄“ – ein Tipp klappt sie auf. */
export function CollapsedCategory({ name, done, total, onExpand }: CollapsedCategoryProps) {
  return (
    <Pressable
      onPress={onExpand}
      role="button"
      aria-label={t("shop.collapsed", { name, done, total })}
      className="mx-page min-h-11 flex-row items-center gap-2.5 border-b border-line py-2 active:opacity-70"
    >
      <Icon as={CheckIcon} size="md" className="text-primary" />
      <Text className="flex-1 text-xs font-extrabold uppercase tracking-widest text-soft">
        {`${name} · ${done}/${total}`}
      </Text>
      <Icon as={ChevronDownIcon} size="md" className="text-soft" />
    </Pressable>
  );
}
