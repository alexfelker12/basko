import { useRouter } from "expo-router";
import { PlusIcon, SettingsIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { LinearTransition } from "react-native-reanimated";

import { EmptyState } from "@/components/empty-state";
import { ListActionsSheet } from "@/components/lists/list-actions-sheet";
import { ListRenameRow, ListRow } from "@/components/lists/list-row";
import { NewListDialog } from "@/components/lists/new-list-dialog";
import { ScreenHeader } from "@/components/screen-header";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { Button, ButtonIcon } from "@/components/ui/button";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useCreateList, useDuplicateList, useLists, useRenameList } from "@/hooks/use-lists";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { purgeList, restoreList, softDeleteList, type ListSummary } from "@/lib/queries/lists";
import type { ListFormValues } from "@/lib/validation";

/** Listen-Übersicht (1a–1g), Start-Tab. */
export default function ListsScreen() {
  const router = useRouter();
  const { data: lists = [], isPending } = useLists();
  const createList = useCreateList();
  const renameList = useRenameList();
  const duplicateList = useDuplicateList();
  const deleteWithUndo = useUndoableDelete();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [menuList, setMenuList] = useState<ListSummary | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);

  const deleteList = (list: ListSummary) =>
    deleteWithUndo({
      key: `list:${list.id}`,
      title: t("common.deleted", { name: list.name }),
      softDelete: () => softDeleteList(list.id),
      restore: () => restoreList(list.id),
      purge: () => purgeList(list.id),
    });

  /** Während des Umbenennens verwirft ein Tipp daneben die Änderung (1d). */
  const cancelRenameFirst = (action: () => void) => () => {
    if (renamingId) {
      setRenamingId(null);
      Keyboard.dismiss();
      return;
    }
    action();
  };

  const closeMenuThen = (action: (list: ListSummary) => void) => () => {
    const list = menuList;
    setMenuList(null);
    if (list) action(list);
  };

  const create = (values: ListFormValues) => {
    setNewListOpen(false);
    createList.mutate(
      values,
      {
        // Nach dem Erstellen öffnet sich der Bearbeiten-Screen der neuen Liste (1f)
        onSuccess: (id) => router.push({ pathname: "/list/[id]/edit", params: { id } }),
      }
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={t("lists.title")}>
        {/* Einstellungen folgen in Phase 6 – bis dahin sichtbar, aber deaktiviert */}
        <Button variant="ghost" size="icon" isDisabled aria-label={t("lists.settings")}>
          <ButtonIcon as={SettingsIcon} />
        </Button>
        <Button size="icon" onPress={() => setNewListOpen(true)} aria-label={t("lists.newList")}>
          <ButtonIcon as={PlusIcon} />
        </Button>
      </ScreenHeader>

      {!isPending && lists.length === 0 ? (
        <EmptyState
          icon={ShoppingCartIcon}
          title={t("lists.empty.title")}
          text={t("lists.empty.text")}
        />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-6">
          {lists.map((list) => (
            <StyledAnimatedView key={list.id} layout={LinearTransition.duration(200)}>
              {renamingId === list.id ? (
                <ListRenameRow
                  list={list}
                  onSubmit={(name) => {
                    setRenamingId(null);
                    renameList.mutate({ id: list.id, name });
                  }}
                  onCancel={() => setRenamingId(null)}
                />
              ) : (
                <SwipeRow
                  label={t("common.delete")}
                  icon={Trash2Icon}
                  tone="danger"
                  actionWidth={SWIPE_ACTION_WIDTH.delete}
                  slideOutOnFullSwipe
                  onAction={() => deleteList(list)}
                  enabled={renamingId === null}
                >
                  <ListRow
                    list={list}
                    onPress={cancelRenameFirst(() =>
                      router.push({ pathname: "/list/[id]", params: { id: list.id } })
                    )}
                    onLongPress={cancelRenameFirst(() => {
                      hapticTap();
                      setRenamingId(list.id);
                    })}
                    onMorePress={cancelRenameFirst(() => setMenuList(list))}
                  />
                </SwipeRow>
              )}
            </StyledAnimatedView>
          ))}
        </ScrollView>
      )}

      <ListActionsSheet
        list={menuList}
        onClose={() => setMenuList(null)}
        onEdit={closeMenuThen((list) =>
          router.push({ pathname: "/list/[id]/edit", params: { id: list.id } })
        )}
        onRename={closeMenuThen((list) => setRenamingId(list.id))}
        onDuplicate={closeMenuThen((list) => duplicateList.mutate(list.id))}
        onDelete={closeMenuThen(deleteList)}
      />

      <NewListDialog
        isOpen={newListOpen}
        onClose={() => setNewListOpen(false)}
        onCreate={create}
      />
    </View>
  );
}
