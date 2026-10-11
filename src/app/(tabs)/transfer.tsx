import { View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";
import { t } from "@/lib/i18n";

// Inhalt folgt in der jeweiligen Phase (siehe CLAUDE.md → Umsetzungsphasen).
export default function TransferScreen() {
  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={t("transfer.title")} />
    </View>
  );
}
