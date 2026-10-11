import { ChevronRightIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { unitLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { MAIN_UNITS, MORE_UNITS, type Unit } from "@/lib/units";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

const isMoreUnit = (unit: Unit) => (MORE_UNITS as readonly Unit[]).includes(unit);

interface UnitPickerProps {
  value: Unit;
  onChange: (unit: Unit) => void;
  productName: string;
}

/**
 * Einheiten-Chips (3e): Hauptauswahl Stk, kg, g, l, ml. Eine gewählte weitere Einheit
 * ersetzt „ml“ als fünften Chip (3e·3); „ml“ steht dann im Sheet „Weitere Einheiten“.
 */
export function UnitPicker({ value, onChange, productName }: UnitPickerProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const chips: Unit[] = [...MAIN_UNITS.slice(0, 4), isMoreUnit(value) ? value : "ml"];

  return (
    <View className="gap-3">
      <View className="flex-row rounded-[999px] bg-chip p-1" role="radiogroup">
        {chips.map((unit) => {
          const selected = unit === value;
          return (
            <Pressable
              key={unit}
              role="radio"
              aria-checked={selected}
              onPress={() => onChange(unit)}
              className={cn(
                "h-9.5 flex-1 items-center justify-center rounded-[999px]",
                selected && "bg-surface"
              )}
            >
              <Text className={cn("text-sm", selected ? "font-extrabold" : "font-bold text-soft")}>
                {unitLabel(unit)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setMoreOpen(true)}
        role="button"
        className="flex-row items-center gap-1 self-start py-1 active:opacity-70"
      >
        <Text className="text-sm font-bold text-primary">{t("itemSheet.moreUnits")}</Text>
        <Icon as={ChevronRightIcon} size="sm" className="text-primary" />
      </Pressable>

      <MoreUnitsSheet
        isOpen={moreOpen}
        value={value}
        productName={productName}
        onClose={() => setMoreOpen(false)}
        onSelect={(unit) => {
          setMoreOpen(false);
          onChange(unit);
        }}
      />
    </View>
  );
}

interface MoreUnitsSheetProps {
  isOpen: boolean;
  value: Unit;
  productName: string;
  onClose: () => void;
  onSelect: (unit: Unit) => void;
}

/** „Weitere Einheiten“ (3e·2): Raster der 12 weiteren Einheiten, 3 Spalten. */
function MoreUnitsSheet({ isOpen, value, productName, onClose, onSelect }: MoreUnitsSheetProps) {
  // Ist eine weitere Einheit gewählt, steht an ihrer Stelle „ml“ mit feinem primary-Rahmen (3e·3)
  const units: Unit[] = MORE_UNITS.map((unit) => (unit === value ? "ml" : unit));
  const rows = [0, 3, 6, 9].map((start) => units.slice(start, start + 3));

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose}>
      <View className="gap-4 px-page pb-4">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-lg font-extrabold">{t("moreUnits.title")}</Text>
          <Text numberOfLines={1} className="ml-3 shrink text-xs text-soft">
            {t("moreUnits.forProduct", { name: productName })}
          </Text>
        </View>
        <View className="gap-2.5">
          {rows.map((row) => (
            <View key={row.join("-")} className="flex-row gap-2.5">
              {row.map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => onSelect(unit)}
                  role="button"
                  className={cn(
                    "h-11 flex-1 items-center justify-center rounded-[999px] bg-chip active:opacity-70",
                    unit === "ml" && "border border-primary"
                  )}
                >
                  <Text className="text-base font-bold">{unitLabel(unit)}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}
