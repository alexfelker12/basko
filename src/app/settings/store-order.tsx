import { LayersIcon, PlusIcon, Trash2Icon } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import ReorderableList, { type ReorderableListReorderEvent } from "react-native-reorderable-list";

import { CategoryRenameRow, DragSortRow } from "@/components/categories/category-row";
import { NewCategoryDialog } from "@/components/categories/new-category-dialog";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { StackHeader } from "@/components/stack-header";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
  useReorderCategories,
} from "@/hooks/use-categories";
import { useLastDefined } from "@/hooks/use-last-defined";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import type { CategoryRow } from "@/lib/queries/categories";

/**
 * Ladenreihenfolge (5a–5c): legt fest, in welcher Reihenfolge Kategorien in allen Listen
 * erscheinen. „Sonstiges“ erscheint hier nicht – sie steht immer am Ende.
 */
export default function StoreOrderScreen() {
  const { data: allCategories = [], isPending } = useCategories();
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const reorderCategories = useReorderCategories();
  const deleteCategory = useDeleteCategory();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const shownDeleting = useLastDefined(deleting);

  const categories = allCategories.filter((category) => !category.isSystem);
  const systemName = allCategories.find((category) => category.isSystem)?.name ?? "";

  const reorder = ({ from, to }: ReorderableListReorderEvent) => {
    const ids = categories.map((category) => category.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorderCategories.mutate(ids);
  };

  /** Während des Umbenennens verwirft ein Tipp daneben die Änderung (wie 1d). */
  const cancelRename = () => {
    setRenamingId(null);
    Keyboard.dismiss();
  };

  const startRename = (id: string) => {
    if (renamingId) {
      cancelRename();
      return;
    }
    hapticTap();
    setRenamingId(id);
  };

  const confirmDelete = () => {
    if (deleting) deleteCategory.mutate(deleting.id);
    setDeleting(null);
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={t("storeOrder.title")}>
        <Button
          size="icon"
          onPress={() => setNewOpen(true)}
          aria-label={t("storeOrder.newCategory")}
        >
          <ButtonIcon as={PlusIcon} />
        </Button>
      </StackHeader>
      <Text className="px-page pb-2 text-xs text-soft">{t("storeOrder.hint")}</Text>

      {!isPending && categories.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title={t("storeOrder.empty.title")}
          text={t("storeOrder.empty.text")}
        />
      ) : (
        <ReorderableList
          data={categories}
          keyExtractor={(category) => category.id}
          onReorder={reorder}
          dragEnabled={renamingId === null}
          shouldUpdateActiveItem
          keyboardShouldPersistTaps="handled"
          // Fremdkomponente ohne className-Unterstützung
          style={{ flex: 1 }}
          ListFooterComponent={<View className="h-6" />}
          renderItem={({ item }) =>
            item.id === renamingId ? (
              <CategoryRenameRow
                category={item}
                otherNames={allCategories
                  .filter((category) => category.id !== item.id)
                  .map((category) => category.name)}
                onSubmit={(name) => {
                  setRenamingId(null);
                  renameCategory.mutate({ id: item.id, name });
                }}
                onCancel={() => setRenamingId(null)}
              />
            ) : (
              <SwipeRow
                label={t("common.delete")}
                icon={Trash2Icon}
                tone="danger"
                actionWidth={SWIPE_ACTION_WIDTH.delete}
                onAction={() => setDeleting(item)}
                enabled={renamingId === null}
              >
                <DragSortRow
                  category={item}
                  onPress={renamingId ? cancelRename : undefined}
                  onLongPress={() => startRename(item.id)}
                />
              </SwipeRow>
            )
          }
        />
      )}

      <NewCategoryDialog
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(name) => {
          setNewOpen(false);
          createCategory.mutate(name);
        }}
      />

      {/* „{Name} löschen? {n} Produkte werden nach Sonstiges verschoben.“ */}
      <Dialog isOpen={deleting !== null} onClose={() => setDeleting(null)}>
        {shownDeleting ? (
          <>
            <Text role="heading" className="text-xl font-extrabold">
              {t("storeOrder.deleteDialog.title", { name: shownDeleting.name })}
            </Text>
            {shownDeleting.productCount > 0 ? (
              <Text className="text-sm text-soft">
                {t("storeOrder.deleteDialog.text", {
                  count: shownDeleting.productCount,
                  target: systemName,
                })}
              </Text>
            ) : null}
            <AlertDialogFooter>
              <Button variant="secondary" onPress={() => setDeleting(null)}>
                <ButtonText>{t("common.cancel")}</ButtonText>
              </Button>
              <Button variant="destructive" onPress={confirmDelete}>
                <ButtonText>{t("common.delete")}</ButtonText>
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}
      </Dialog>
    </View>
  );
}
