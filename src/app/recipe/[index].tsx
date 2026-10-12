import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { QuantityChip } from "@/components/quantity-chip";
import { CreateRecipeListModal } from "@/components/recipes/create-recipe-list-modal";
import { NutritionStat } from "@/components/recipes/nutrition-stat";
import { SectionHeader } from "@/components/section-header";
import { StackHeader } from "@/components/stack-header";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRecipeSearch } from "@/hooks/use-recipes";
import { formatNumber, t } from "@/lib/i18n";
import type { Recipe } from "@/lib/recipes/api";
import { formatOriginalAmount } from "@/lib/recipes/ingredients";

/**
 * Rezept-Details (7d), Stack-Screen ohne Tab-Leiste. Es gibt keinen Detail-Endpunkt: Die Daten
 * kommen aus der Trefferliste im Query-Cache (Suchbegriff + Position). Unten fest
 * „Einkaufsliste erstellen“ (7e).
 */
export default function RecipeDetailScreen() {
  const router = useRouter();
  const { index = "0", query = "" } = useLocalSearchParams<{ index?: string; query?: string }>();
  const { data } = useRecipeSearch(query);
  const recipe = data?.[Number(index)];
  const [creating, setCreating] = useState(false);

  return (
    <View className="flex-1 bg-bg">
      <StackHeader />

      {recipe ? (
        <>
          <ScrollView contentContainerClassName="pb-6">
            <RecipeContent recipe={recipe} />
          </ScrollView>

          <View className="border-t border-line bg-bg px-page pb-safe">
            <View className="pb-1 pt-2.5">
              <Button onPress={() => setCreating(true)} className="h-12">
                <ButtonText>{t("recipeDetail.createList")}</ButtonText>
              </Button>
            </View>
          </View>

          <CreateRecipeListModal
            recipe={creating ? recipe : null}
            onClose={() => setCreating(false)}
            onCreated={(listId) => {
              setCreating(false);
              // Details schließen, Listen-Tab, darüber der Bearbeiten-Screen der neuen Liste
              // (‹ führt in die Übersicht). `navigate` könnte die Tabs ein zweites Mal stapeln.
              router.dismissTo({ pathname: "/", params: { edit: listId } });
            }}
          />
        </>
      ) : null}
    </View>
  );
}

/** Nährwerte ganzzahlig gerundet; fehlt ein Wert, steht „–“. */
function nutritionValue(value: number | null, unit?: "g"): string {
  if (value === null) return "–";
  const rounded = formatNumber(Math.round(value), { max: 0 });
  return unit ? t("recipeDetail.grams", { value: rounded }) : rounded;
}

function RecipeContent({ recipe }: { recipe: Recipe }) {
  const { nutrition } = recipe;

  return (
    <>
      <View className="px-page">
        <Text role="heading" className="text-xl font-extrabold tracking-[-0.2px]">
          {recipe.title}
        </Text>
        {recipe.servings ? (
          <Text className="mt-0.75 text-xs text-soft">{recipe.servings}</Text>
        ) : null}

        {/* Nährwerte pro Rezept (nicht pro Portion), 4 Chips */}
        <View className="mt-4 flex-row gap-2">
          <NutritionStat
            value={nutritionValue(nutrition.calories)}
            label={t("recipeDetail.nutrition.calories")}
          />
          <NutritionStat
            value={nutritionValue(nutrition.protein, "g")}
            label={t("recipeDetail.nutrition.protein")}
          />
          <NutritionStat
            value={nutritionValue(nutrition.carbs, "g")}
            label={t("recipeDetail.nutrition.carbs")}
          />
          <NutritionStat
            value={nutritionValue(nutrition.fat, "g")}
            label={t("recipeDetail.nutrition.fat")}
          />
        </View>
        <Text className="mt-1.5 text-xs text-soft">{t("recipeDetail.perRecipe")}</Text>
      </View>

      {recipe.ingredients.length > 0 ? (
        <>
          <View className="pt-2">
            <SectionHeader title={t("recipeDetail.ingredients")} />
          </View>
          {recipe.ingredients.map((ingredient, index) => {
            const original = formatOriginalAmount(ingredient);
            return (
              <View
                key={`${ingredient.name}:${index}`}
                className="mx-page flex-row items-center gap-2.5 border-b border-line py-2.75"
              >
                <Text className="flex-1 text-base font-bold">{ingredient.name}</Text>
                {original ? <QuantityChip label={original} /> : null}
              </View>
            );
          })}
        </>
      ) : null}

      {recipe.instructions.length > 0 ? (
        <>
          <View className="pt-2">
            <SectionHeader title={t("recipeDetail.instructions")} />
          </View>
          {recipe.instructions.map((step, index) => (
            <View key={index} className="mx-page flex-row gap-3 py-2.5">
              <View className="size-6.5 shrink-0 items-center justify-center rounded-[999px] bg-chip">
                <Text className="text-xs font-extrabold">{index + 1}</Text>
              </View>
              <Text className="flex-1 pt-0.5 text-sm leading-relaxed">{step}</Text>
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}
