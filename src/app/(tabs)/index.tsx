import { useLocalSearchParams, useRouter } from "expo-router";
import { PlusIcon, SettingsIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { LinearTransition } from "react-native-reanimated";

import { EmptyState } from "@/components/empty-state";
import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { ListActionsSheet } from "@/components/lists/list-actions-sheet";
import { ListRenameRow, ListRow } from "@/components/lists/list-row";
import { NewListDialog } from "@/components/lists/new-list-dialog";
import { ScreenHeader } from "@/components/screen-header";
import { ScreenPattern } from "@/components/screen-pattern";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { Button, ButtonIcon } from "@/components/ui/button";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useAppToast } from "@/hooks/use-app-toast";
import { useScrollFocusedInputIntoView } from "@/hooks/use-keyboard";
import { useCreateList, useDuplicateList, useLists, useRenameList } from "@/hooks/use-lists";
import { useExportList } from "@/hooks/use-transfer";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { purgeList, restoreList, softDeleteList, type ListSummary } from "@/lib/queries/lists";
import type { ListFormValues } from "@/lib/validation";

/** Listen-Übersicht (1a–1g), Start-Tab. */
export default function ListsScreen() {
  const router = useRouter();
  const showToast = useAppToast();
  /** Aus dem Transfer-Verlauf (6a): „···“-Menü dieser Liste öffnen. */
  const { menu: menuParam } = useLocalSearchParams<{ menu?: string }>();
  const { data: lists = [], isPending } = useLists();
  const createList = useCreateList();
  const renameList = useRenameList();
  const duplicateList = useDuplicateList();
  const deleteWithUndo = useUndoableDelete();
  const exportList = useExportList();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [menuList, setMenuList] = useState<ListSummary | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);

  // Inline-Umbenennen (1d) weiter unten: die Zeile über die Tastatur scrollen
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  useScrollFocusedInputIntoView(renamingId !== null, (dy) =>
    scrollRef.current?.scrollTo({ y: scrollOffset.current + dy, animated: true })
  );

  // Den Parameter einmal auswerten (sobald die Listen geladen sind), danach aus der Route entfernen
  const [handledMenuParam, setHandledMenuParam] = useState<string | null>(null);
  if (menuParam && menuParam !== handledMenuParam && !isPending) {
    setHandledMenuParam(menuParam);
    const list = lists.find((item) => item.id === menuParam);
    if (list) {
      setRenamingId(null);
      setMenuList(list);
    }
  } else if (!menuParam && handledMenuParam) {
    setHandledMenuParam(null);
  }
  useEffect(() => {
    if (menuParam && menuParam === handledMenuParam) router.setParams({ menu: undefined });
  }, [menuParam, handledMenuParam, router]);

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
    // Während der Export läuft, bleibt das Menü stehen
    if (exportList.isPending) return;
    const list = menuList;
    setMenuList(null);
    if (list) action(list);
  };

  /**
   * „Als Datei exportieren“: Das Menü bleibt mit Spinner offen, bis die Datei fertig ist, und
   * schließt sich direkt vor dem Teilen-Menü.
   */
  const exportMenuList = () => {
    if (!menuList || exportList.isPending) return;
    exportList.mutate(
      { listId: menuList.id, onReady: () => setMenuList(null) },
      {
        onError: (error) => {
          console.warn("[transfer] export", error);
          showToast({ title: t("errors.generic") });
        },
        onSettled: () => setMenuList(null),
      }
    );
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
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <ScreenHeader title={t("lists.title")}>
        {/* Einstellungen (8a) – vorerst nur mit der Ladenreihenfolge, der Rest folgt in Phase 6 */}
        <Button
          variant="ghost"
          size="icon"
          onPress={cancelRenameFirst(() => router.push("/settings"))}
          aria-label={t("lists.settings")}
        >
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
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-6"
        >
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
          <KeyboardSpacer />
        </ScrollView>
      )}

      <ListActionsSheet
        list={menuList}
        onClose={() => setMenuList(null)}
        onEdit={closeMenuThen((list) =>
          router.push({ pathname: "/list/[id]/edit", params: { id: list.id } })
        )}
        onRename={closeMenuThen((list) => setRenamingId(list.id))}
        onSend={closeMenuThen((list) =>
          router.push({ pathname: "/transfer/send/[listId]", params: { listId: list.id } })
        )}
        onExport={exportMenuList}
        exporting={exportList.isPending}
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
