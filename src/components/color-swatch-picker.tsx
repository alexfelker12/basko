import { CheckIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { t } from "@/lib/i18n";
import { LIST_COLOR_BG, LIST_COLORS, type ListColor } from "@/lib/list-colors";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface ColorSwatchPickerProps {
  value: ListColor;
  onChange: (color: ListColor) => void;
}

/** ColorSwatchPicker: 5 Kreise à 44, gewählt = Ring + Haken (1f, 3g). */
export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <View className="flex-row justify-between" role="radiogroup">
      {LIST_COLORS.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            role="radio"
            aria-checked={selected}
            aria-label={t(`listColors.${color}`)}
            onPress={() => onChange(color)}
            className={cn(
              "size-13.5 items-center justify-center rounded-[999px] border-2",
              selected ? "border-ink" : "border-transparent"
            )}
          >
            <View
              className={cn(
                "size-11 items-center justify-center rounded-[999px]",
                LIST_COLOR_BG[color]
              )}
            >
              {selected ? (
                <Icon
                  as={CheckIcon}
                  size="lg"
                  className={color === "green" ? "text-primary-ink" : "text-white"}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
