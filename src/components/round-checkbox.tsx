import { CheckIcon } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";

/** Checkbox rund (24): offen = `soft`-Rahmen, erledigt = `primary` mit 55 % Deckkraft. */
export function RoundCheckbox({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <View className="size-6 items-center justify-center rounded-[999px] bg-primary opacity-55">
        <Icon as={CheckIcon} className="h-3.5 w-3.5 text-primary-ink" />
      </View>
    );
  }
  return <View className="size-6 rounded-[999px] border-2 border-soft" />;
}
