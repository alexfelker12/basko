import { View } from "react-native";

import { LIST_COLOR_BG, type ListColor } from "@/lib/list-colors";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Farbbalken 10 × 34, Radius 5 (ListRow). */
export function ListColorBar({ color }: { color: ListColor }) {
  return <View className={cn("h-8.5 w-2.5 rounded-[5px]", LIST_COLOR_BG[color])} />;
}
