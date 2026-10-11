import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { ArrowLeftRight, List, Package, Soup } from "lucide-react-native";
import { View } from "react-native";

import { TabBarButton } from "@/components/tab-bar";
import { t } from "@/lib/i18n";

/**
 * Vier Tabs mit eigener Tab-Leiste über die Headless-Tabs von expo-router/ui,
 * damit Android und iOS gleich aussehen (Spezifikation → Grundlagen → Navigation).
 */
export default function TabsLayout() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot />

      <TabList asChild>
        <View className="flex-row border-t border-line bg-bg px-1 pb-0.5 pt-2">
          <TabTrigger name="lists" href="/" asChild>
            <TabBarButton label={t("tabs.lists")} animation="expand" icon={List} />
          </TabTrigger>
          <TabTrigger name="products" href="/products" asChild>
            <TabBarButton label={t("tabs.products")} animation="pop" icon={Package} />
          </TabTrigger>
          <TabTrigger name="transfer" href="/transfer" asChild>
            <TabBarButton label={t("tabs.transfer")} animation="wiggle" icon={ArrowLeftRight} />
          </TabTrigger>
          <TabTrigger name="recipes" href="/recipes" asChild>
            <TabBarButton label={t("tabs.recipes")} animation="rise" icon={Soup} />
          </TabTrigger>
        </View>
      </TabList>

      {/* Bereich hinter der Navigationsleiste (Rand bis Rand) */}
      <View className="bg-bg pb-safe" />
    </Tabs>
  );
}
