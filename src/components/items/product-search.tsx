import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { PlusIcon, SearchIcon } from "lucide-react-native";
import { useDeferredValue, useMemo } from "react";
import { Pressable, View } from "react-native";

import { HighlightedText } from "@/components/highlighted-text";
import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/hooks/use-catalog";
import { useSheetKeyboardHandlers } from "@/hooks/use-sheet-keyboard";
import { PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { t } from "@/lib/i18n";
import { isNameTaken } from "@/lib/names";
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
 * Inhalt des Such-Sheets (3c/3d): Eingabe oben mit Fokus, Treffer mit Name, Kategorie und Hinweisen.
 * „‚{Suchtext}‘ neu anlegen“ steht immer als letzte Zeile, auch mit Treffern („Käse“ findet
 * „Frischkäse“ und soll trotzdem anlegbar sein) – außer ein Treffer heißt genau so. Ohne Treffer
 * steht darüber „Kein Produkt gefunden.“ Die Suche ist eine Live-Filterung, kein Formular.
 */
export function ProductSearch({
  query,
  onQueryChange,
  itemIdsByProduct,
  onSelect,
  onCreate,
}: ProductSearchProps) {
  const { data: catalog = [] } = useCatalog();
  const sheetKeyboard = useSheetKeyboardHandlers();
  // Tippen bleibt flüssig: die Trefferliste rechnet React nachrangig mit dem letzten Stand
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchProducts(catalog, deferredQuery, itemIdsByProduct),
    [catalog, deferredQuery, itemIdsByProduct]
  );
  const trimmed = deferredQuery.trim();
  // Ein gleichnamiges Produkt wäre ein Treffer (Teilwort) – die Treffer reichen für die Prüfung
  const canCreate =
    trimmed !== "" && !isNameTaken(trimmed, results.map((result) => result.product.name));

  return (
    <View className="flex-1">
      <View className="px-page pb-1">
        <Input>
          <InputSlot>
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            autoFocus
            value={query}
            onChangeText={onQueryChange}
            onFocus={sheetKeyboard?.onFocus}
            onBlur={sheetKeyboard?.onBlur}
            placeholder={t("editList.searchPlaceholder")}
            maxLength={PRODUCT_NAME_MAX}
            returnKeyType="search"
            autoCorrect={false}
            aria-label={t("editList.searchPlaceholder")}
          />
        </Input>
      </View>

      {/* Virtualisiert: Bei großem Katalog trifft „a“ schnell Tausende Produkte */}
      <BottomSheetFlatList
        data={results}
        keyExtractor={(result) => result.product.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <ResultRow result={item} onPress={() => onSelect(item)} />}
        ListFooterComponent={
          <>
            {canCreate ? (
              <View className={cn("px-page", results.length === 0 && "pt-4")}>
                {results.length === 0 ? (
                  <Text className="text-xs text-soft">{t("search.noResult")}</Text>
                ) : null}
                <Pressable
                  onPress={() => onCreate(trimmed)}
                  role="button"
                  className={cn(
                    "flex-row items-center gap-3 border-b border-line py-3 active:opacity-70",
                    results.length === 0 && "mt-1.5"
                  )}
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
            <View className="h-4" />
            {/* Das hohe Sheet bleibt bei offener Tastatur stehen – Platz, um bis ans Ende zu scrollen */}
            <KeyboardSpacer />
          </>
        }
      />
    </View>
  );
}

function ResultRow({ result, onPress }: { result: ProductSearchResult; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-page flex-row items-center gap-3 border-b border-line py-3 active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <HighlightedText parts={result.parts} className="text-base font-bold" />
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
        {/* „in Liste“ sagt mehr – dann kein zweiter Hinweis „zuletzt genutzt“ */}
        {result.recent && !result.listItemId ? (
          <Badge>
            <BadgeText>{t("search.recent")}</BadgeText>
          </Badge>
        ) : null}
      </View>
    </Pressable>
  );
}
