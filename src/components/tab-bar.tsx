import type { TabTriggerSlotProps } from "expo-router/ui";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: LucideIcon;
};

/**
 * Eintrag der Tab-Leiste (TabBar, Komponenten 10a).
 * Aktiv: Pille 56 × 30 in `chip`, Icon und Text in `primary`; sonst `soft`.
 * Wird von `TabTrigger asChild` mit `isFocused`, `onPress` usw. versorgt.
 */
export function TabBarButton({ label, icon, isFocused, style, ref, ...props }: TabBarButtonProps) {
  return (
    <Pressable
      ref={ref}
      role="tab"
      aria-selected={isFocused}
      aria-label={label}
      className="min-h-13 flex-1 items-center flex-col gap-1"
      {...props}
    >
      <View
        className={cn(
          "h-7.5 w-14 items-center justify-center rounded-[999px]",
          isFocused && "bg-chip"
        )}
      >
        <Icon as={icon} size="lg" className={cn(isFocused ? "text-primary" : "text-soft")} />
      </View>
      <Text
        numberOfLines={1}
        className={cn("text-xs", isFocused ? "font-extrabold text-primary" : "font-bold text-soft")}
      >
        {label}
      </Text>
    </Pressable>
  );
}
