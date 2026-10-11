import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Text } from "@/components/ui/text";
import { useCatalog, useCreateProduct, useUpdateProduct } from "@/hooks/use-catalog";
import { useLastDefined } from "@/hooks/use-last-defined";
import { PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { useAppForm } from "@/lib/form";
import { t } from "@/lib/i18n";
import { photoDraftsFromFiles } from "@/lib/images";
import { isNameTaken } from "@/lib/names";
import { getSystemCategoryId } from "@/lib/queries/categories";
import { getProductImages, type CatalogProduct } from "@/lib/queries/products";
import { productFormSchema, type ProductFormValues } from "@/lib/validation";

/** Was das Produkt-Sheet zeigt: neues Produkt (optional mit Namen aus der Suche) oder Bearbeiten. */
export type ProductSheetState =
  { kind: "create"; name?: string } | { kind: "edit"; product: CatalogProduct } | null;

interface ProductSheetProps {
  state: ProductSheetState;
  onClose: () => void;
  /** Nach jeder Schließ-Animation (z. B. um das nächste Sheet zu öffnen). */
  onClosed?: () => void;
  /** Neu angelegt – liefert das Produkt, z. B. für das Hinzufügen-Sheet (3d). */
  onCreated?: (product: CatalogProduct) => void;
}

/**
 * Neues Produkt (4d) bzw. Produkt bearbeiten (gleiches Sheet mit „Speichern“).
 * Gespeichert wird erst mit dem Knopf; Wegwischen verwirft (auch neu gewählte Fotos).
 */
export function ProductSheet({ state, onClose, onClosed, onCreated }: ProductSheetProps) {
  const shown = useLastDefined(state);

  return (
    <Sheet isOpen={state !== null} onDismiss={onClose} onClosed={onClosed}>
      {shown ? (
        <ProductForm
          key={shown.kind === "edit" ? shown.product.id : `new:${shown.name ?? ""}`}
          state={shown}
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Sheet>
  );
}

interface ProductFormProps {
  state: NonNullable<ProductSheetState>;
  onClose: () => void;
  onCreated?: (product: CatalogProduct) => void;
}

function ProductForm({ state, onClose, onCreated }: ProductFormProps) {
  const { data: catalog = [] } = useCatalog();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const editing = state.kind === "edit" ? state.product : null;

  // Vorbelegung einmal beim Öffnen: Kategorie „Sonstiges“ (neu) bzw. vorhandene Fotos (bearbeiten)
  const [defaultValues] = useState<ProductFormValues>(() =>
    editing
      ? {
          name: editing.name,
          categoryId: editing.categoryId,
          photos: photoDraftsFromFiles(getProductImages(editing.id)),
        }
      : {
          name: state.kind === "create" ? (state.name ?? "") : "",
          categoryId: getSystemCategoryId() ?? "",
          photos: [],
        }
  );

  const otherNames = catalog
    .filter((product) => product.id !== editing?.id)
    .map((product) => product.name);
  const nameValidator = ({ value }: { value: string }) =>
    isNameTaken(value, otherNames) ? t("productForm.nameTaken") : undefined;

  const form = useAppForm({
    defaultValues,
    validators: { onMount: productFormSchema, onChange: productFormSchema },
    onSubmit: ({ value }) => {
      const values = {
        name: value.name.trim(),
        categoryId: value.categoryId,
        photos: value.photos,
      };
      if (editing) {
        updateProduct.mutate({ id: editing.id, values }, { onSuccess: onClose });
      } else {
        createProduct.mutate(values, {
          onSuccess: (product) => {
            if (!product) return;
            onClose();
            onCreated?.(product);
          },
        });
      }
    },
  });

  return (
    <View className="gap-4 px-page pb-4">
      <Text role="heading" className="text-xl font-extrabold">
        {editing ? t("productForm.editTitle") : t("productForm.newTitle")}
      </Text>

      <form.AppField name="name" validators={{ onMount: nameValidator, onChange: nameValidator }}>
        {(field) => (
          <field.TextField
            label={t("productForm.name")}
            autoFocus={!editing}
            maxLength={PRODUCT_NAME_MAX}
            returnKeyType="done"
          />
        )}
      </form.AppField>

      <form.AppField name="categoryId">{(field) => <field.CategoryField />}</form.AppField>

      <form.Subscribe selector={(formState) => formState.values.name}>
        {(name) => (
          <form.AppField name="photos">
            {(field) => <field.PhotosField productName={name.trim()} />}
          </form.AppField>
        )}
      </form.Subscribe>

      <form.AppForm>
        <form.SubmitButton
          label={editing ? t("productForm.save") : t("productForm.create")}
          className="mt-1"
        />
      </form.AppForm>
    </View>
  );
}
