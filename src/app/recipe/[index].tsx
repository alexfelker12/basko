import { useLocalSearchParams } from "expo-router";

import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { useRecipeSearch } from "@/hooks/use-recipes";

/**
 * Details (7d) eines Suchtreffers. Es gibt keinen Detail-Endpunkt: Die Daten kommen aus der
 * Trefferliste im Query-Cache (Suchbegriff + Position).
 */
export default function SearchRecipeScreen() {
  const { index = "0", query = "" } = useLocalSearchParams<{ index?: string; query?: string }>();
  const { data } = useRecipeSearch(query);
  return <RecipeDetail recipe={data?.[Number(index)]} />;
}
