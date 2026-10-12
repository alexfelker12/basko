import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ScrollView, TextInput, View } from "react-native";

import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useCatalog } from "@/hooks/use-catalog";
import { useCreateRecipeList } from "@/hooks/use-recipes";
import { PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import { normalizeName } from "@/lib/names";
import type { Recipe } from "@/lib/recipes/api";
import { mergeEntries, originalsNote, recipeListEntries } from "@/lib/recipes/ingredients";
import { recipeListFormSchema, type RecipeListFormValues } from "@/lib/validation";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface CreateRecipeListModalProps {
  /** Offen, solange ein Rezept gesetzt ist. Ein gespeichertes (mit `id`) wird wiederverwendet. */
  recipe: (Recipe & { id?: string }) | null;
  onClose: () => void;
  /** Nach dem Anlegen, mit der ID der neuen Liste. */
  onCreated: (listId: string) => void;
}

/** Abstand zwischen fokussiertem Feld und Footer beim Hochscrollen. */
const FOCUSED_INPUT_MARGIN = 16;

/**
 * Einkaufsliste erstellen (7e): hohes Modal mit festem Footer. Listenname = Rezepttitel,
 * je Zutat Haken, bearbeitbarer Name, Originalangabe und Hinweis „bereits vorhanden“ /
 * „neues Produkt“ (aktualisiert sich beim Umbenennen). Doppelte Zutaten sind zusammengefasst –
 * auch solche, die erst durch Umbenennen gleich heißen.
 */
export function CreateRecipeListModal({ recipe, onClose, onCreated }: CreateRecipeListModalProps) {
  return recipe ? (
    <RecipeListModal recipe={recipe} onClose={onClose} onCreated={onCreated} />
  ) : null;
}

function RecipeListModal({
  recipe,
  onClose,
  onCreated,
}: CreateRecipeListModalProps & { recipe: Recipe & { id?: string } }) {
  const showToast = useAppToast();
  const createList = useCreateRecipeList();
  const { data: catalog = [] } = useCatalog();
  const knownNames = useMemo(
    () => new Set(catalog.map((product) => normalizeName(product.name))),
    [catalog]
  );

  const [entries] = useState(() => recipeListEntries(recipe.ingredients));

  const form = useAppForm({
    defaultValues: {
      name: recipe.title,
      ingredients: entries.map((entry) => ({ key: entry.key, selected: true, name: entry.name })),
    } as RecipeListFormValues,
    validators: { onMount: recipeListFormSchema, onChange: recipeListFormSchema },
    onSubmit: ({ value }) => {
      if (createList.isPending) return;
      const byKey = new Map(entries.map((entry) => [entry.key, entry]));
      const chosen = mergeEntries(
        value.ingredients.flatMap((ingredient) => {
          const entry = byKey.get(ingredient.key);
          const name = ingredient.name.trim();
          if (!entry || !ingredient.selected || !name) return [];
          return [{ name, originals: entry.originals, amount: entry.amount }];
        })
      );
      if (chosen.length === 0) return;

      createList.mutate(
        {
          name: value.name,
          recipe,
          items: chosen.map((entry) => ({
            name: entry.name,
            amount: entry.amount,
            note: originalsNote(entry.originals),
          })),
        },
        {
          onSuccess: onCreated,
          onError: (error) => {
            console.warn("[recipes] create list", error);
            showToast({ title: t("errors.generic") });
          },
        }
      );
    },
  });

  // Ein fokussiertes Namensfeld über den Footer scrollen, sobald die Tastatur steht
  // (das Modal ist dann um die Tastaturhöhe niedriger, siehe `KeyboardSpacer`)
  const bodyRef = useRef<ScrollView>(null);
  const footerRef = useRef<View>(null);
  const scrollY = useRef(0);
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      const input = TextInput.State.currentlyFocusedInput();
      const footer = footerRef.current;
      if (!input || !footer) return;
      footer.measureInWindow((_x, footerY) => {
        input.measureInWindow((_ix, inputY, _width, inputHeight) => {
          const overlap = inputY + inputHeight + FOCUSED_INPUT_MARGIN - footerY;
          if (overlap > 0) {
            bodyRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
          }
        });
      });
    });
    return () => subscription.remove();
  }, []);

  return (
    <Modal isOpen onClose={onClose} closeOnOverlayClick={false} size="lg">
      <ModalBackdrop />
      <View className="pt-safe" />
      <ModalContent className="mb-8 mt-6 max-h-none flex-1">
        <ModalHeader className="flex-col items-stretch gap-3.5 pb-4 pt-5">
          <Text role="heading" className="text-xl font-extrabold">
            {t("recipeList.title")}
          </Text>
          <form.AppField name="name">
            {(field) => <field.TextField label={t("recipeList.nameLabel")} returnKeyType="done" />}
          </form.AppField>
        </ModalHeader>

        {/* Wie ModalBody, aber als ScrollView mit Ref (zum Hochscrollen über die Tastatur) */}
        <ScrollView
          ref={bodyRef}
          className="flex-1 px-page"
          contentContainerClassName="pb-3"
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {entries.map((entry, index) => (
            <View key={entry.key} className="flex-row gap-1.5 border-b border-line py-3">
              <form.AppField name={`ingredients[${index}].selected`}>
                {(field) => (
                  <field.CheckboxField
                    label={t("recipeList.select", { name: entry.name })}
                    className="-ml-2.5"
                  />
                )}
              </form.AppField>

              <form.Subscribe selector={(state) => state.values.ingredients[index]}>
                {(ingredient) => {
                  const selected = ingredient?.selected ?? true;
                  const name = normalizeName(ingredient?.name ?? "");
                  return (
                    <View className={cn("min-w-0 flex-1 gap-1.5", !selected && "opacity-45")}>
                      <form.AppField name={`ingredients[${index}].name`}>
                        {(field) => (
                          <field.TextField
                            size="sm"
                            accessibilityLabel={t("recipeList.ingredientName")}
                            maxLength={PRODUCT_NAME_MAX}
                            returnKeyType="done"
                          />
                        )}
                      </form.AppField>
                      <View className="flex-row flex-wrap items-center gap-2">
                        {entry.originals.length > 0 ? (
                          <Text className="text-xs text-soft">{entry.originals.join(" + ")}</Text>
                        ) : null}
                        {name ? <ProductHint known={knownNames.has(name)} /> : null}
                      </View>
                    </View>
                  );
                }}
              </form.Subscribe>
            </View>
          ))}
        </ScrollView>

        {/* Plain View als Messpunkt – die Ref-Typen von ModalFooter passen nicht zu View */}
        <View ref={footerRef}>
          <ModalFooter>
            <Button variant="secondary" onPress={onClose}>
              <ButtonText>{t("common.cancel")}</ButtonText>
            </Button>
            <form.Subscribe
              selector={(state) =>
                [
                  state.canSubmit,
                  state.values.ingredients.some((item) => item.selected && item.name.trim()),
                ] as const
              }
            >
              {([canSubmit, hasSelection]) => (
                <Button
                  onPress={() => form.handleSubmit()}
                  isDisabled={!canSubmit || !hasSelection || createList.isPending}
                >
                  <ButtonText>{t("common.create")}</ButtonText>
                </Button>
              )}
            </form.Subscribe>
          </ModalFooter>
        </View>
      </ModalContent>
      <KeyboardSpacer />
      <View className="pb-safe" />
    </Modal>
  );
}

/** Hinweis je Zutat: Name passt zu einem Produkt (ohne Groß-/Kleinschreibung) oder nicht. */
function ProductHint({ known }: { known: boolean }) {
  return known ? (
    <Badge variant="neutral">
      <BadgeText>{t("recipeList.known")}</BadgeText>
    </Badge>
  ) : (
    <Badge variant="warning">
      <View className="size-1.5 rounded-[999px] bg-amber" />
      <BadgeText>{t("recipeList.new")}</BadgeText>
    </Badge>
  );
}
