import { useState } from "react";

import { Sheet } from "@/components/sheet";
import { useAppToast } from "@/hooks/use-app-toast";
import { useCreateProductInOther } from "@/hooks/use-catalog";
import { useAddListItem, useUpdateListItem } from "@/hooks/use-list-items";
import { t } from "@/lib/i18n";
import type { ProductSearchResult } from "@/lib/product-search";
import type { CatalogProduct } from "@/lib/queries/products";
import type { ItemValues, ListItemRow } from "@/lib/queries/list-items";
import { DEFAULT_UNIT } from "@/lib/units";

import { ItemForm } from "./item-form";
import { ProductSearch } from "./product-search";

/** Zustand des Sheets in „Liste bearbeiten“: Suche → Hinzufügen bzw. Bearbeiten. */
export type AddItemsStep =
  | { kind: "closed" }
  | { kind: "search" }
  | { kind: "add"; product: CatalogProduct }
  | { kind: "edit"; item: ListItemRow; fromSearch: boolean };

interface AddItemsSheetProps {
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
 * Ein Sheet für Suche (3c/3d), Hinzufügen (3e) und Bearbeiten (3) – der Inhalt wechselt,
 * statt Sheets übereinander zu öffnen. Nach dem Hinzufügen geht es leer zurück zur Suche.
 */
export function AddItemsSheet({ listId, items, step, onStepChange, onDeleteItem }: AddItemsSheetProps) {
  const [query, setQuery] = useState("");
  const showToast = useAppToast();
  const addItem = useAddListItem();
  const updateItem = useUpdateListItem();
  const createProduct = useCreateProductInOther();

  const itemIdsByProduct = new Map(items.map((item) => [item.productId, item.id]));
  const close = () => onStepChange({ kind: "closed" });

  const openSearch = (clearQuery: boolean) => {
    if (clearQuery) setQuery("");
    onStepChange({ kind: "search" });
  };

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

  return (
    <Sheet
      isOpen={step.kind !== "closed"}
      onClose={close}
      className={step.kind === "search" ? "h-9/10 max-h-9/10" : undefined}
    >
      {step.kind === "search" ? (
        <ProductSearch
          query={query}
          onQueryChange={setQuery}
          itemIdsByProduct={itemIdsByProduct}
          onSelect={selectResult}
          onCreate={create}
        />
      ) : null}

      {step.kind === "add" ? (
        <ItemForm
          key={step.product.id}
          product={step.product}
          initial={initialValuesFor(step.product)}
          onBack={() => openSearch(false)}
          submitLabel={t("itemSheet.add")}
          onSubmit={(values) =>
            addItem.mutate(
              { listId, productId: step.product.id, values },
              {
                onSuccess: () => {
                  showToast({ title: t("itemSheet.added", { name: step.product.name }) });
                  // Danach öffnet sich die Suche wieder leer mit Tastatur (3e)
                  openSearch(true);
                },
              }
            )
          }
        />
      ) : null}

      {step.kind === "edit" ? (
        <ItemForm
          key={step.item.id}
          product={{ name: step.item.productName, categoryName: step.item.categoryName }}
          initial={step.item}
          onBack={step.fromSearch ? () => openSearch(false) : undefined}
          submitLabel={t("common.done")}
          onSubmit={(values) => {
            updateItem.mutate({ id: step.item.id, values });
            close();
          }}
          deleteLabel={t("itemSheet.deleteItem")}
          onDelete={() => {
            close();
            onDeleteItem(step.item);
          }}
        />
      ) : null}
    </Sheet>
  );
}
