import { useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { ScreenPattern } from "@/components/screen-pattern";
import { StackHeader } from "@/components/stack-header";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";

/**
 * Einstellungen (8a) – vorerst nur „Ladenreihenfolge ›“. Gerätename, Darstellung,
 * Daten & Sicherung und „Über die App“ folgen in Phase 6.
 */
export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster – VORLÄUFIG zum Vergleich, siehe ScreenPattern */}
      <ScreenPattern variant="bubbles" />
      <StackHeader title={t("settings.title")} />
      <View className="mx-page border-t border-line">
        <Pressable
          onPress={() => router.push("/settings/store-order")}
          role="button"
          className="min-h-14 flex-row items-center gap-3 border-b border-line py-row active:opacity-70"
        >
          <Text className="flex-1 text-base font-bold">{t("settings.storeOrder")}</Text>
          <Icon as={ChevronRightIcon} size="md" className="text-soft" />
        </Pressable>
      </View>
    </View>
  );
}
