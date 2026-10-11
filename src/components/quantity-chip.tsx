import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** QuantityChip (2a): „6 Stk“ auf `chip`; erledigt mit 45 % Deckkraft. */
export function QuantityChip({ label, dimmed }: { label: string; dimmed?: boolean }) {
  return (
    <View className={cn("shrink-0 rounded-[999px] bg-chip px-2.5 py-1", dimmed && "opacity-45")}>
      {/* Android misst Text mit der „highQuality“-Umbruchstrategie teils knapp zu schmal und
          bricht dann das letzte Wort in eine unsichtbare zweite Zeile („3 Stk“ → „3“) */}
      <Text textBreakStrategy="simple" className="text-xs font-bold">
        {label}
      </Text>
    </View>
  );
}
