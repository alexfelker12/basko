import { useRouter } from "expo-router";
import {
  ChefHatIcon,
  CloudOffIcon,
  ListPlusIcon,
  SearchIcon,
  SearchXIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { CreateRecipeListModal } from "@/components/recipes/create-recipe-list-modal";
import { RecipeRow } from "@/components/recipes/recipe-row";
import { ScreenHeader } from "@/components/screen-header";
import { ScreenPattern } from "@/components/screen-pattern";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRecipeSearch } from "@/hooks/use-recipes";
import { t } from "@/lib/i18n";
import { RecipeApiError, type Recipe } from "@/lib/recipes/api";

/**
 * Rezepte-Tab (7a–7c, 7e): Suche nach englischen Rezepten über API Ninjas – erst beim Bestätigen
 * auf der Tastatur, max. 5 Treffer, kein „Mehr laden“. Ein Tipp öffnet die Details (7d), Wischen
 * nach links legt „Liste erstellen“ frei.
 */
export default function RecipesScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  /** Bestätigter Suchbegriff; leer = Hinweis „Wonach suchst du?“ (7a). */
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState<Recipe | null>(null);
  const search = useRecipeSearch(query);

  const submit = () => setQuery(input.trim());
  const clear = () => {
    setInput("");
    setQuery("");
  };

  const openList = (listId: string) => {
    setCreating(null);
    // Listen-Tab, darüber der Bearbeiten-Screen der neuen Liste (‹ führt in die Übersicht)
    router.navigate({ pathname: "/", params: { edit: listId } });
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <ScreenHeader title={t("recipes.title")} />

      <View className="px-page pb-1.5">
        <Input>
          <InputSlot>
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            placeholder={t("recipes.searchPlaceholder")}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            aria-label={t("recipes.searchPlaceholder")}
          />
          {input ? (
            <InputSlot
              onPress={clear}
              role="button"
              aria-label={t("recipes.clearSearch")}
              className="size-9 items-center justify-center"
            >
              <InputIcon as={XIcon} />
            </InputSlot>
          ) : null}
        </Input>
      </View>

      {!query ? (
        <EmptyState
          icon={ChefHatIcon}
          title={t("recipes.empty.title")}
          text={t("recipes.empty.text")}
        />
      ) : search.isPending ? (
        <View className="flex-1 items-center justify-center pb-15">
          <Spinner size="large" className="text-primary" />
        </View>
      ) : search.isError ? (
        <SearchError error={search.error} onRetry={() => search.refetch()} />
      ) : search.data.length === 0 ? (
        <EmptyState icon={SearchXIcon} title={t("recipes.noResults", { query })} />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-6">
          {search.data.map((recipe, index) => (
            <SwipeRow
              key={`${recipe.title}:${index}`}
              label={t("recipes.createList")}
              icon={ListPlusIcon}
              tone="primary"
              actionWidth={SWIPE_ACTION_WIDTH.createList}
              onAction={() => setCreating(recipe)}
            >
              <RecipeRow
                recipe={recipe}
                onPress={() =>
                  router.push({
                    pathname: "/recipe/[index]",
                    params: { index: String(index), query },
                  })
                }
              />
            </SwipeRow>
          ))}
        </ScrollView>
      )}

      <CreateRecipeListModal
        recipe={creating}
        onClose={() => setCreating(null)}
        onCreated={openList}
      />
    </View>
  );
}

/** „Keine Verbindung“ mit „Erneut versuchen“ bzw. „Rezeptsuche gerade nicht verfügbar“ (7b). */
function SearchError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  if (error instanceof RecipeApiError && error.reason === "offline") {
    return (
      <EmptyState icon={WifiOffIcon} title={t("recipes.offline")}>
        <Button variant="secondary" onPress={onRetry}>
          <ButtonText>{t("recipes.retry")}</ButtonText>
        </Button>
      </EmptyState>
    );
  }
  return <EmptyState icon={CloudOffIcon} title={t("recipes.unavailable")} />;
}
