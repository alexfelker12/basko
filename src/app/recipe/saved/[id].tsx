import { useLocalSearchParams } from "expo-router";

import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { useSavedRecipe } from "@/hooks/use-recipes";

/** Details (7d) eines gespeicherten Rezepts – aus der Datenbank, ohne API-Aufruf. */
export default function SavedRecipeScreen() {
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const { data } = useSavedRecipe(id);
  return <RecipeDetail recipe={data} />;
}
