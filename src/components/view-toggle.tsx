import { LayoutGridIcon, ListIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { t } from "@/lib/i18n";
import type { ProductsView } from "@/lib/settings";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

const OPTIONS = [
  { value: "list", icon: ListIcon, label: "products.listView" },
  { value: "grid", icon: LayoutGridIcon, label: "products.gridView" },
] as const;

/** ViewToggle (Komponenten 10a): Liste/Raster als Pille auf `chip`, gewählt = `surface`. */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ProductsView;
  onChange: (value: ProductsView) => void;
}) {
  return (
    <View className="flex-row rounded-[999px] bg-chip p-0.75" role="radiogroup">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            role="radio"
            aria-checked={selected}
            aria-label={t(option.label)}
            className={cn(
              "h-9.5 w-10.5 items-center justify-center rounded-[999px]",
              selected && "bg-surface"
            )}
          >
            <Icon as={option.icon} size="md" className={cn(selected ? "text-ink" : "text-soft")} />
          </Pressable>
        );
      })}
    </View>
  );
}
