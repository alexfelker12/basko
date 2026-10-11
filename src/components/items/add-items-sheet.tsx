import { useState } from "react";

import { useLastDefined } from "@/hooks/use-last-defined";

import { Sheet } from "@/components/sheet";
import { useAppToast } from "@/hooks/use-app-toast";
import { useCreateProductInOther } from "@/hooks/use-catalog";
import { useAddListItem, useUpdateListItem } from "@/hooks/use-list-items";
import { t } from "@/lib/i18n";
import type { ProductSearchResult } from "@/lib/product-search";
import type { ItemValues, ListItemRow } from "@/lib/queries/list-items";
import type { CatalogProduct } from "@/lib/queries/products";
import { DEFAULT_UNIT } from "@/lib/units";

import { ItemForm } from "./item-form";
import { ProductSearch } from "./product-search";

/** Zustand in „Liste bearbeiten“: Suche → Hinzufügen bzw. Bearbeiten. */
export type AddItemsStep =
  | { kind: "closed" }
  | { kind: "search" }
  | { kind: "add"; product: CatalogProduct }
  | { kind: "edit"; item: ListItemRow; fromSearch: boolean };

interface AddItemsSheetsProps {
  listId: string;
  items: ListItemRow[];
  step: AddItemsStep;
  onStepChange: (step: AddItemsStep) => void;
  onDeleteItem: (item: ListItemRow) => void;
}

/** Vorbelegung: zuletzt benutzte Menge und Einheit des Produkts, sonst 1 Stk (3e). */
function initialValuesFor(product: CatalogProduct): ItemValues {
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
  const createProduct = useCreateProductInOther();

  const itemStep = useLastDefined(step.kind === "add" || step.kind === "edit" ? step : null);
  const itemIdsByProduct = new Map(items.map((item) => [item.productId, item.id]));
  const close = () => onStepChange({ kind: "closed" });
  const backToSearch = () => onStepChange({ kind: "search" });

  const selectResult = ({ product, listItemId }: ProductSearchResult) => {
    const item = listItemId ? items.find((entry) => entry.id === listItemId) : undefined;
    onStepChange(item ? { kind: "edit", item, fromSearch: true } : { kind: "add", product });
  };

  const create = (name: string) =>
    createProduct.mutate(name, {
      onSuccess: (product) => {
        if (product) onStepChange({ kind: "add", product });
      },
    });

  /** Schließen per Wischen/Zurück – nur wenn dieses Sheet gerade das aktive ist. */
  const closeIf = (kind: AddItemsStep["kind"][]) => () => {
    if (kind.includes(step.kind)) close();
  };

  return (
    <>
      <Sheet isOpen={step.kind === "search"} onClose={closeIf(["search"])} fullHeight>
        <ProductSearch
          query={query}
          onQueryChange={setQuery}
          itemIdsByProduct={itemIdsByProduct}
          onSelect={selectResult}
          onCreate={create}
        />
      </Sheet>

      <Sheet isOpen={step.kind === "add" || step.kind === "edit"} onClose={closeIf(["add", "edit"])}>
        {itemStep?.kind === "add" ? (
          <ItemForm
            key={itemStep.product.id}
            product={itemStep.product}
            initial={initialValuesFor(itemStep.product)}
            onBack={backToSearch}
            submitLabel={t("itemSheet.add")}
            onSubmit={(values) =>
              addItem.mutate(
                { listId, productId: itemStep.product.id, values },
                {
                  onSuccess: () => {
                    showToast({ title: t("itemSheet.added", { name: itemStep.product.name }) });
                    setQuery("");
                    backToSearch();
                  },
                }
              )
            }
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
