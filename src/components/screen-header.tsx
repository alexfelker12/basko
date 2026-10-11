import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";

interface ScreenHeaderProps {
  title: string;
  /** Aktionen rechts, z. B. runde Icon-Buttons (44 × 44). */
  children?: ReactNode;
}

/** Kopfzeile der Tab-Screens (1a): 60 hoch, Titel 19 px / 800, Seitenabstand 18. */
export function ScreenHeader({ title, children }: ScreenHeaderProps) {
  return (
    <View className="pt-safe">
      <View className="h-[60px] flex-row items-center gap-1.5 px-page">
        <Text
          role="heading"
          numberOfLines={1}
          className="flex-1 text-[19px] font-extrabold tracking-[-0.2px]"
        >
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
