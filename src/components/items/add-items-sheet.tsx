import { useState } from "react";

import { useLastDefined } from "@/hooks/use-last-defined";

import { Sheet } from "@/components/sheet";
import { useAppToast } from "@/hooks/use-app-toast";
import { useOtherCategoryName } from "@/hooks/use-catalog";
import {
  useAddListItem,
  useAddNewProductToList,
  useUpdateListItem,
} from "@/hooks/use-list-items";
import { t } from "@/lib/i18n";
import type { ProductSearchResult } from "@/lib/product-search";
import type { ItemValues, ListItemRow } from "@/lib/queries/list-items";
import type { CatalogProduct } from "@/lib/queries/products";
import { DEFAULT_UNIT } from "@/lib/units";

import { ItemForm } from "./item-form";
import { ProductSearch } from "./product-search";

/**
 * Produkt im Hinzufügen-Sheet: aus dem Katalog oder – bei „‚{Suchtext}‘ neu anlegen“ – ein Entwurf
 * ohne ID, der erst beim Absenden angelegt wird.
 */
export type AddableProduct = Pick<
  CatalogProduct,
  "name" | "categoryName" | "lastQuantity" | "lastUnit"
> & { id: string | null };

/** Zustand in „Liste bearbeiten“: Suche → Hinzufügen bzw. Bearbeiten. */
export type AddItemsStep =
  | { kind: "closed" }
  | { kind: "search" }
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
 * Such-Sheet (3c/3d, 90 % hoch) und Eintrags-Sheet für Hinzufügen (3e) bzw. Bearbeiten (3).
 * Nach dem Hinzufügen öffnet sich die Suche wieder leer mit Tastatur.
 */
export function AddItemsSheets({ listId, items, step, onStepChange, onDeleteItem }: AddItemsSheetsProps) {
  const [query, setQuery] = useState("");
  const showToast = useAppToast();
  const addItem = useAddListItem();
  const updateItem = useUpdateListItem();
  const addNewProduct = useAddNewProductToList();
  const otherCategoryName = useOtherCategoryName() ?? "";

  const itemStep = useLastDefined(step.kind === "add" || step.kind === "edit" ? step : null);

  // Nie zwei Sheets gleichzeitig: das nächste öffnet erst, wenn das vorige ganz zu ist.
  // (Gleichzeitig schließen/öffnen samt Tastatur ließ das neue Sheet sofort wieder zugehen.)
  const [searchVisible, setSearchVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const searchOpen = step.kind === "search" && !itemVisible;
  const itemOpen = (step.kind === "add" || step.kind === "edit") && !searchVisible;
  if (searchOpen && !searchVisible) setSearchVisible(true);
  if (itemOpen && !itemVisible) setItemVisible(true);
  const itemIdsByProduct = new Map(items.map((item) => [item.productId, item.id]));
  const close = () => onStepChange({ kind: "closed" });
  const backToSearch = () => onStepChange({ kind: "search" });

  const selectResult = ({ product, listItemId }: ProductSearchResult) => {
    const item = listItemId ? items.find((entry) => entry.id === listItemId) : undefined;
    onStepChange(item ? { kind: "edit", item, fromSearch: true } : { kind: "add", product });
  };

  /** „Neu anlegen“ öffnet nur das Hinzufügen-Sheet; angelegt wird erst beim Absenden. */
  const create = (name: string) =>
    onStepChange({
      kind: "add",
      product: { id: null, name, categoryName: otherCategoryName, lastQuantity: null, lastUnit: null },
    });

  const add = (product: AddableProduct, values: ItemValues) => {
    const onSuccess = () => {
      showToast({ title: t("itemSheet.added", { name: product.name }) });
      setQuery("");
      backToSearch();
    };
    if (product.id) {
      addItem.mutate({ listId, productId: product.id, values }, { onSuccess });
    } else {
      addNewProduct.mutate({ listId, name: product.name, values }, { onSuccess });
    }
  };

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

      <Sheet isOpen={itemOpen} onDismiss={close} onClosed={() => setItemVisible(false)}>
        {itemStep?.kind === "add" ? (
          <ItemForm
            key={itemStep.product.id ?? `new:${itemStep.product.name}`}
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
