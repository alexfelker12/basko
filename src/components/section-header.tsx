import { View } from "react-native";

import { Text } from "@/components/ui/text";

/** SectionHeader (sticky, 2a/3a): Kategorie in Großbuchstaben, 800, `primary`. */
export function SectionHeader({ title }: { title: string }) {
  return (
    <View className="bg-bg px-page pb-1.5 pt-4">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">{title}</Text>
    </View>
  );
}
