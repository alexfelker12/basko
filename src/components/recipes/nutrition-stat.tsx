import { View } from "react-native";

import { Text } from "@/components/ui/text";

/** NutritionStat (7d): Wert groß, Bezeichnung klein darunter, auf `chip`. */
export function NutritionStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-card bg-chip px-1 py-2.5">
      <Text numberOfLines={1} className="text-base font-extrabold">
        {value}
      </Text>
      <Text numberOfLines={1} className="text-xs font-semibold text-soft">
        {label}
      </Text>
    </View>
  );
}
