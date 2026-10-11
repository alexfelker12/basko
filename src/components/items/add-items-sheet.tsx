import { useState } from "react";

import { ProductSheet } from "@/components/products/product-sheet";
import { Sheet } from "@/components/sheet";
import { useLastDefined } from "@/hooks/use-last-defined";
import { useAddListItem, useUpdateListItem } from "@/hooks/use-list-items";
import { t } from "@/lib/i18n";
import type { ProductSearchResult } from "@/lib/product-search";
import type { ItemValues, ListItemRow } from "@/lib/queries/list-items";
import type { CatalogProduct } from "@/lib/queries/products";
import { DEFAULT_UNIT } from "@/lib/units";

import { ItemForm } from "./item-form";
import { ProductSearch } from "./product-search";

/** Produkt im Hinzufügen-Sheet (3e). */
export type AddableProduct = Pick<
  CatalogProduct,
  "id" | "name" | "categoryName" | "lastQuantity" | "lastUnit"
>;

/**
 * Zustand in „Liste bearbeiten“: Suche → Hinzufügen bzw. Bearbeiten; „‚{Suchtext}‘ neu anlegen“
 * (3d) führt über „Neues Produkt“ (4d) direkt ins Hinzufügen-Sheet.
 */
export type AddItemsStep =
  | { kind: "closed" }
  | { kind: "search" }
  | { kind: "create"; name: string }
  | { kind: "add"; product: AddableProduct }
  | { kind: "edit"; item: ListItemRow; fromSearch: boolean };

interface AddItemsSheetsProps {
  listId: string;
  items: ListItemRow[];
  step: AddItemsStep;
  onStepChange: (step: AddItemsStep) => void;
  onDeleteItem: (item: ListItemRow) => void;
}

/** Vorbelegung: zuletzt benutzte Menge und Einheit des Produkts, sonst 1 Stk (3e). */
function initialValuesFor(product: AddableProduct): ItemValues {
  return product.lastQuantity && product.lastUnit
    ? { quantity: product.lastQuantity, unit: product.lastUnit, note: null }
    : { quantity: 1, unit: DEFAULT_UNIT, note: null };
}

/**
 * Such-Sheet (3c/3d, 90 % hoch), „Neues Produkt“ (4d) und Eintrags-Sheet für Hinzufügen (3e)
 * bzw. Bearbeiten (3). Nach dem Hinzufügen öffnet sich die Suche wieder leer mit Tastatur.
 */
export function AddItemsSheets({ listId, items, step, onStepChange, onDeleteItem }: AddItemsSheetsProps) {
  const [query, setQuery] = useState("");
  const addItem = useAddListItem();
  const updateItem = useUpdateListItem();

  const itemStep = useLastDefined(step.kind === "add" || step.kind === "edit" ? step : null);

  // Nie zwei Sheets gleichzeitig: das nächste öffnet erst, wenn das vorige ganz zu ist.
  // (Gleichzeitig schließen/öffnen samt Tastatur ließ das neue Sheet sofort wieder zugehen.)
  const [searchVisible, setSearchVisible] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const searchOpen = step.kind === "search" && !productVisible && !itemVisible;
  const productOpen = step.kind === "create" && !searchVisible && !itemVisible;
  const itemOpen = (step.kind === "add" || step.kind === "edit") && !searchVisible && !productVisible;
  if (searchOpen && !searchVisible) setSearchVisible(true);
  if (productOpen && !productVisible) setProductVisible(true);
  if (itemOpen && !itemVisible) setItemVisible(true);
  const itemIdsByProduct = new Map(items.map((item) => [item.productId, item.id]));
  const close = () => onStepChange({ kind: "closed" });
  const backToSearch = () => onStepChange({ kind: "search" });

  const selectResult = ({ product, listItemId }: ProductSearchResult) => {
    const item = listItemId ? items.find((entry) => entry.id === listItemId) : undefined;
    onStepChange(item ? { kind: "edit", item, fromSearch: true } : { kind: "add", product });
  };

  /** „Neu anlegen“ (3d) öffnet „Neues Produkt“ (4d) mit dem Suchtext als Namen. */
  const create = (name: string) => onStepChange({ kind: "create", name });

  const add = (product: AddableProduct, values: ItemValues) =>
    addItem.mutate(
      { listId, productId: product.id, values },
      {
        onSuccess: () => {
          setQuery("");
          backToSearch();
        },
      }
    );

  return (
    <>
      <Sheet
        isOpen={searchOpen}
        onDismiss={close}
        onClosed={() => setSearchVisible(false)}
        fullHeight
      >
        <ProductSearch
          query={query}
          onQueryChange={setQuery}
          itemIdsByProduct={itemIdsByProduct}
          onSelect={selectResult}
          onCreate={create}
        />
      </Sheet>

      {/* Nach dem Anlegen geht es direkt ins Hinzufügen-Sheet; Wegwischen legt nichts an */}
      <ProductSheet
        state={productOpen && step.kind === "create" ? step : null}
        onClose={close}
        onClosed={() => setProductVisible(false)}
        onCreated={(product) => onStepChange({ kind: "add", product })}
        onBack={backToSearch}
      />

      {/* Android-Zurück wie „‹“: aus der Suche heraus zurück zur Suche, sonst schließen */}
      <Sheet
        isOpen={itemOpen}
        onDismiss={close}
        onClosed={() => setItemVisible(false)}
        onBack={
          itemStep?.kind === "add" || (itemStep?.kind === "edit" && itemStep.fromSearch)
            ? backToSearch
            : undefined
        }
      >
        {itemStep?.kind === "add" ? (
          <ItemForm
            key={itemStep.product.id}
            product={itemStep.product}
            initial={initialValuesFor(itemStep.product)}
            onBack={backToSearch}
            submitLabel={t("itemSheet.add")}
            onSubmit={(values) => add(itemStep.product, values)}
          />
        ) : null}

        {itemStep?.kind === "edit" ? (
          <ItemForm
            key={itemStep.item.id}
            product={{ name: itemStep.item.productName, categoryName: itemStep.item.categoryName }}
            initial={itemStep.item}
            onBack={itemStep.fromSearch ? backToSearch : undefined}
            submitLabel={t("common.done")}
            onSubmit={(values) => {
              updateItem.mutate({ id: itemStep.item.id, values });
              close();
            }}
            deleteLabel={t("itemSheet.deleteItem")}
            onDelete={() => {
              close();
              onDeleteItem(itemStep.item);
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}
