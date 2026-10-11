import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  /** Optionaler Knopf darunter. */
  children?: ReactNode;
}

/** EmptyState (Komponenten): 88er Kreis mit Icon, Titel, Text. */
export function EmptyState({ icon, title, text, children }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-10">
      <View className="mb-2 size-22 items-center justify-center rounded-[999px] bg-chip">
        <Icon as={icon} className="h-9 w-9 text-soft" />
      </View>
      <Text className="text-center text-lg font-extrabold">{title}</Text>
      {text ? <Text className="text-center text-sm text-soft">{text}</Text> : null}
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}
