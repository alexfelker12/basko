import { View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";
import { ScreenPattern } from "@/components/screen-pattern";
import { t } from "@/lib/i18n";

// Inhalt folgt in der jeweiligen Phase (siehe CLAUDE.md → Umsetzungsphasen).
export default function RecipesScreen() {
  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <ScreenHeader title={t("recipes.title")} />
    </View>
  );
}
