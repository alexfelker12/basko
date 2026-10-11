import { PlusIcon, SearchIcon } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/hooks/use-catalog";
import { PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { t } from "@/lib/i18n";
import { searchProducts, type ProductSearchResult } from "@/lib/product-search";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

interface ProductSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Produkt-ID → Eintrags-ID der aktuellen Liste (Hinweis „in Liste“). */
  itemIdsByProduct: Map<string, string>;
  onSelect: (result: ProductSearchResult) => void;
  onCreate: (name: string) => void;
}

/**
 * Such-Sheet (3c/3d): Eingabe oben mit Fokus, Treffer mit Name, Kategorie und Hinweisen.
 * Ohne Treffer: „‚{Suchtext}‘ neu anlegen“.
 */
export function ProductSearch({
  query,
  onQueryChange,
  itemIdsByProduct,
  onSelect,
  onCreate,
}: ProductSearchProps) {
  const { data: catalog = [] } = useCatalog();
  const results = useMemo(
    () => searchProducts(catalog, query, itemIdsByProduct),
    [catalog, query, itemIdsByProduct]
  );
  const trimmed = query.trim();

  return (
    <View className="flex-1 px-page">
      <Input>
        <InputSlot>
          <InputIcon as={SearchIcon} />
        </InputSlot>
        <InputField
          autoFocus
          value={query}
          onChangeText={onQueryChange}
          placeholder={t("editList.searchPlaceholder")}
          maxLength={PRODUCT_NAME_MAX}
          returnKeyType="search"
          autoCorrect={false}
          aria-label={t("editList.searchPlaceholder")}
        />
      </Input>

      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" contentContainerClassName="pb-4">
        {results.map((result) => (
          <ResultRow key={result.product.id} result={result} onPress={() => onSelect(result)} />
        ))}

        {trimmed && results.length === 0 ? (
          <View className="pt-4">
            <Text className="text-xs text-soft">{t("search.noResult")}</Text>
            <Pressable
              onPress={() => onCreate(trimmed)}
              role="button"
              className="mt-1.5 flex-row items-center gap-3 border-b border-line py-3 active:opacity-70"
            >
              <View className="size-8 items-center justify-center rounded-[999px] bg-chip">
                <Icon as={PlusIcon} size="md" className="text-ink" />
              </View>
              <Text className="flex-1 text-base font-bold text-primary">
                {t("search.create", { name: trimmed })}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultRow({ result, onPress }: { result: ProductSearchResult; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-line py-3 active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base font-bold">
          {result.parts.map((part, index) => (
            <Text
              key={index}
              className={cn("text-base", part.match ? "font-extrabold text-primary" : "font-bold")}
            >
              {part.text}
            </Text>
          ))}
        </Text>
        <Text numberOfLines={1} className="text-xs text-soft">
          {result.product.categoryName}
        </Text>
      </View>
      <View className="items-end gap-1">
        {result.listItemId ? (
          <Badge>
            <BadgeText>{t("search.inList")}</BadgeText>
          </Badge>
        ) : null}
        {result.recent ? (
          <Badge>
            <BadgeText>{t("search.recent")}</BadgeText>
          </Badge>
        ) : null}
      </View>
    </Pressable>
  );
}
