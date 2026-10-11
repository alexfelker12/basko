import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** QuantityChip (2a): „6 Stk“ auf `chip`; erledigt mit 45 % Deckkraft. */
export function QuantityChip({ label, dimmed }: { label: string; dimmed?: boolean }) {
  return (
    <View className={cn("rounded-[999px] bg-chip px-2.5 py-1", dimmed && "opacity-45")}>
      <Text className="text-xs font-bold">{label}</Text>
    </View>
  );
}
