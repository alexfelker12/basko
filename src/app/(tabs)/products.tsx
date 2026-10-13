import { PackageIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Keyboard, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { ProductPhotoViewer } from "@/components/image-viewer";
import { KeyboardSticky } from "@/components/keyboard-sticky";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductActionsSheet } from "@/components/products/product-actions-sheet";
import { ProductRow, ProductTile } from "@/components/products/product-row";
import { ProductSheet, type ProductSheetState } from "@/components/products/product-sheet";
import { ScreenHeader } from "@/components/screen-header";
import { ScreenPattern } from "@/components/screen-pattern";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { ViewToggle } from "@/components/view-toggle";
import { useCatalog, useDeleteProduct } from "@/hooks/use-catalog";
import { useCategories } from "@/hooks/use-categories";
import { useSettings, useUpdateSetting } from "@/hooks/use-settings";
import { PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { filterCatalog, type CatalogMatch } from "@/lib/product-search";
import type { CatalogProduct } from "@/lib/queries/products";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

const GRID_COLUMNS = 3;
/**
 * Gerenderter Bereich in Bildschirmhöhen (Standard 21): Bei großem Katalog bleiben so weniger Zeilen
 * samt Vorschaubildern eingehängt, gescrollt wird trotzdem ohne Lücken.
 */
const LIST_WINDOW_SIZE = 11;

/** Was nach dem Schließen des Aktionen-Sheets (4f) passieren soll – nie zwei Sheets gleichzeitig. */
type PendingAction = { kind: "edit" | "delete"; product: CatalogProduct } | null;

/**
 * Produkte-Tab (4a–4f): globaler Katalog alphabetisch, als Liste oder Raster, mit schwebender
 * Suche und Kategorie-Filter unten.
 */
export default function ProductsScreen() {
  const { productsView } = useSettings();
  const updateSetting = useUpdateSetting();
  const { data: catalog = [], isPending } = useCatalog();
  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();

  const [query, setQuery] = useState("");
  const [filterId, setFilterId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ProductSheetState>(null);
  const [menuProduct, setMenuProduct] = useState<CatalogProduct | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [deleting, setDeleting] = useState<CatalogProduct | null>(null);
  const [viewerProduct, setViewerProduct] = useState<CatalogProduct | null>(null);

  // Eine inzwischen gelöschte Kategorie filtert nicht mehr
  const activeFilterId = categories.some((category) => category.id === filterId) ? filterId : null;
  // Tippen bleibt flüssig: Filtern und Neuaufbau der Liste laufen nachrangig mit dem letzten Stand
  const deferredQuery = useDeferredValue(query);
  const matches = useMemo(
    () => filterCatalog(catalog, deferredQuery, activeFilterId),
    [catalog, deferredQuery, activeFilterId]
  );
  const trimmed = deferredQuery.trim();
  const catalogEmpty = !isPending && catalog.length === 0;

  // Die Suchleiste sitzt über der Tab-Leiste: mit Tastatur nur um den Rest anheben
  // (Abstand Unterkante Screen → Bildschirmrand = Tab-Leiste + Navigationsleiste)
  const frame = useSafeAreaFrame();
  const [screenHeight, setScreenHeight] = useState(frame.height);
  const tabBarGap = Math.max(0, frame.height - screenHeight);

  const openMenuAction = (kind: "edit" | "delete") => {
    if (menuProduct) setPending({ kind, product: menuProduct });
    setMenuProduct(null);
  };

  const runPending = () => {
    if (!pending) return;
    if (pending.kind === "edit") setSheet({ kind: "edit", product: pending.product });
    else setDeleting(pending.product);
    setPending(null);
  };

  // Aktionen an einem Produkt schließen die Tastatur der Suche – sonst bliebe sie unter dem
  // Aktionen-Sheet, der Vollbildansicht bzw. dem Bearbeiten-Sheet (ohne eigenen Fokus) offen
  const openMenu = (product: CatalogProduct) => {
    Keyboard.dismiss();
    setMenuProduct(product);
  };

  const itemProps = (match: CatalogMatch) => ({
    match,
    onPress: () => {
      Keyboard.dismiss();
      setSheet({ kind: "edit", product: match.product });
    },
    onImagePress: () => {
      Keyboard.dismiss();
      setViewerProduct(match.product);
    },
    onMorePress: () => openMenu(match.product),
  });

  // Leer-Inhalt ohne eigenen Seitenabstand: Die Liste (4a) hat keinen, das Raster (4b) trägt
  // `px-page` schon am Inhalt – so sitzt „neu anlegen“ in beiden Ansichten gleich.
  const noResults = trimmed ? (
    <Pressable
      onPress={() => setSheet({ kind: "create", name: trimmed })}
      role="button"
      className="flex-row items-center gap-3 border-b border-line py-3 active:opacity-70"
    >
      <View className="size-8 items-center justify-center rounded-[999px] bg-chip">
        <Icon as={PlusIcon} size="md" className="text-ink" />
      </View>
      <Text className="flex-1 text-base font-bold text-primary">
        {t("search.create", { name: trimmed })}
      </Text>
    </Pressable>
  ) : (
    <Text className="pt-2 text-center text-sm text-soft">
      {t("products.noneInCategory", {
        name: categories.find((category) => category.id === activeFilterId)?.name ?? "",
      })}
    </Text>
  );

  return (
    <View
      className="flex-1 bg-bg"
      onLayout={(event) => setScreenHeight(event.nativeEvent.layout.height)}
    >
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <ScreenHeader title={t("products.title")}>
        <ViewToggle
          value={productsView}
          onChange={(value) => updateSetting.mutate({ key: "productsView", value })}
        />
        <Button
          size="icon"
          onPress={() => setSheet({ kind: "create" })}
          aria-label={t("products.newProduct")}
          className="ml-1"
        >
          <ButtonIcon as={PlusIcon} />
        </Button>
      </ScreenHeader>

      {catalogEmpty ? (
        <EmptyState
          icon={PackageIcon}
          title={t("products.empty.title")}
          text={t("products.empty.text")}
        />
      ) : productsView === "grid" ? (
        <FlatList
          key="grid"
          data={padToColumns(matches)}
          numColumns={GRID_COLUMNS}
          keyExtractor={(match, index) => match?.product.id ?? `empty:${index}`}
          windowSize={LIST_WINDOW_SIZE}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="gap-4 px-page pb-40 pt-1.5"
          columnWrapperClassName="gap-3"
          ListEmptyComponent={isPending ? null : <View className="pt-2.5">{noResults}</View>}
          renderItem={({ item }) => (
            <View className="flex-1">
              {item ? (
                <ProductTile
                  {...itemProps(item)}
                  onLongPress={() => {
                    hapticTap();
                    openMenu(item.product);
                  }}
                />
              ) : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          key="list"
          data={matches}
          keyExtractor={(match) => match.product.id}
          windowSize={LIST_WINDOW_SIZE}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="pb-40"
          ListEmptyComponent={isPending ? null : <View className="px-page pt-4">{noResults}</View>}
          renderItem={({ item }) => <ProductRow {...itemProps(item)} />}
        />
      )}

      {/* Schwebende Suche mit Kategorie-Chips darüber (4a) */}
      {catalogEmpty ? null : (
        <KeyboardSticky bottomGap={tabBarGap} className="absolute bottom-0 left-0 right-0">
          <View className="bg-bg pb-2.5 pt-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-2 px-page pb-2"
            >
              <FilterChip
                label={t("products.filterAll")}
                selected={activeFilterId === null}
                onPress={() => setFilterId(null)}
              />
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  selected={category.id === activeFilterId}
                  onPress={() => setFilterId(category.id)}
                />
              ))}
            </ScrollView>
            <View className="px-page">
              <Input>
                <InputSlot>
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("products.searchPlaceholder")}
                  maxLength={PRODUCT_NAME_MAX}
                  returnKeyType="search"
                  autoCorrect={false}
                  aria-label={t("products.searchPlaceholder")}
                />
                {query ? (
                  <InputSlot
                    onPress={() => setQuery("")}
                    role="button"
                    aria-label={t("products.clearSearch")}
                    className="size-8 items-center justify-center"
                  >
                    <InputIcon as={XIcon} />
                  </InputSlot>
                ) : null}
              </Input>
            </View>
          </View>
        </KeyboardSticky>
      )}

      <ProductActionsSheet
        product={menuProduct}
        onClose={() => setMenuProduct(null)}
        onClosed={runPending}
        onEdit={() => openMenuAction("edit")}
        onDelete={() => openMenuAction("delete")}
      />

      <ProductSheet state={sheet} onClose={() => setSheet(null)} />

      <DeleteProductDialog
        product={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(product) => {
          setDeleting(null);
          deleteProduct.mutate(product.id);
        }}
      />

      <ProductPhotoViewer product={viewerProduct} onClose={() => setViewerProduct(null)} />
    </View>
  );
}

/** Füllt die letzte Rasterzeile mit leeren Zellen auf, damit Kacheln überall gleich breit sind. */
function padToColumns(matches: CatalogMatch[]): (CatalogMatch | null)[] {
  const rest = matches.length % GRID_COLUMNS;
  return rest === 0 ? matches : [...matches, ...Array<null>(GRID_COLUMNS - rest).fill(null)];
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      className={cn(
        "h-9 items-center justify-center rounded-[999px] px-3.5 active:opacity-80",
        selected ? "bg-primary" : "bg-chip"
      )}
    >
      <Text className={cn("text-sm font-bold", selected ? "text-primary-ink" : "text-ink")}>
        {label}
      </Text>
    </Pressable>
  );
}
