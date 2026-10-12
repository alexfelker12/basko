import { ChevronRightIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";
import type { Recipe } from "@/lib/recipes/api";

/** Treffer der Rezeptsuche (7b): Titel, Portionen wie geliefert und ›. */
export function RecipeRow({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={t("recipes.showRecipe", { title: recipe.title })}
      className="mx-page flex-row items-center gap-2.5 border-b border-line py-row active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <Text numberOfLines={2} className="text-base font-bold">
          {recipe.title}
        </Text>
        {recipe.servings ? (
          <Text numberOfLines={1} className="mt-0.5 text-xs text-soft">
            {recipe.servings}
          </Text>
        ) : null}
      </View>
      <Icon as={ChevronRightIcon} size="md" className="text-soft" />
    </Pressable>
  );
}
