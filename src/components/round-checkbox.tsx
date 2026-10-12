import { CheckIcon } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/**
 * Checkbox rund (24): offen = `soft`-Rahmen, erledigt = `primary` – im Einkaufsmodus (2a) mit
 * 55 % Deckkraft, als Auswahl (7e) mit `faded={false}` voll deckend.
 */
export function RoundCheckbox({ checked, faded = true }: { checked: boolean; faded?: boolean }) {
  if (checked) {
    return (
      <View
        className={cn(
          "size-6 items-center justify-center rounded-[999px] bg-primary",
          faded && "opacity-55"
        )}
      >
        <Icon as={CheckIcon} className="h-3.5 w-3.5 text-primary-ink" />
      </View>
    );
  }
  return <View className="size-6 rounded-[999px] border-2 border-soft" />;
}
