import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckIcon, ListIcon, PencilIcon, RotateCcwIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { EmptyState } from "@/components/empty-state";
import { ProductPhotoViewer } from "@/components/image-viewer";
import { ItemForm } from "@/components/items/item-form";
import { SectionHeader } from "@/components/section-header";
import { Sheet } from "@/components/sheet";
import { CollapsedCategory, ShopRow } from "@/components/shop/shop-row";
import { StackHeader } from "@/components/stack-header";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import {
  useListItems,
  useResetListChecks,
  useSetItemChecked,
  useUpdateListItem,
} from "@/hooks/use-list-items";
import { useLastDefined } from "@/hooks/use-last-defined";
import { useListSummary, useTouchList } from "@/hooks/use-lists";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { hapticTap } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { groupListItems, type CategoryGroup } from "@/lib/list-grouping";
import {
  purgeListItem,
  restoreListItem,
  softDeleteListItem,
  type ListItemRow,
} from "@/lib/queries/list-items";

const ROW_TRANSITION = LinearTransition.duration(220);

const isComplete = (group: CategoryGroup) => group.checkedCount === group.items.length;

/** Einkaufsmodus (2a–2c): in Ladenreihenfolge abhaken, erledigte sinken, fertige Kategorien klappen zu. */
export default function ShopScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: list } = useListSummary(id);
  const { data: items = [], isPending } = useListItems(id);
  const touchList = useTouchList();
  const setChecked = useSetItemChecked(id);
  const resetChecks = useResetListChecks();
  const updateItem = useUpdateListItem();
  const deleteWithUndo = useUndoableDelete();

  /** Von Hand aufgeklappte, fertige Kategorien – gilt nur, solange der Screen offen ist. */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [quickEdit, setQuickEdit] = useState<ListItemRow | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<ListItemRow | null>(null);
  const shownQuickEdit = useLastDefined(quickEdit);

  // Einkaufsmodus öffnen zählt als Benutzung der Liste
  const { mutate: touch } = touchList;
  useEffect(() => touch(id), [id, touch]);

  const groups = groupListItems(items, { checkedLast: true });
  const allDone = items.length > 0 && items.every((item) => item.checked);

  const toggle = (item: ListItemRow) => {
    hapticTap();
    const checked = !item.checked;
    setChecked.mutate({ id: item.id, checked });

    // Wird die Kategorie damit fertig, klappt sie automatisch zu – auch wenn sie aufgeklappt war
    const group = groups.find((entry) => entry.categoryId === item.categoryId);
    if (checked && group && group.checkedCount + 1 === group.items.length) {
      setExpanded((current) => {
        const next = new Set(current);
        next.delete(item.categoryId);
        return next;
      });
    }
  };

  const expand = (categoryId: string) =>
    setExpanded((current) => new Set(current).add(categoryId));

  const reset = () => {
    setResetOpen(false);
    resetChecks.mutate(id);
  };

  const removeItem = (item: ListItemRow) => {
    setQuickEdit(null);
    deleteWithUndo({
      key: `item:${item.id}`,
      title: t("common.deleted", { name: item.productName }),
      softDelete: () => softDeleteListItem(item.id),
      restore: () => restoreListItem(item.id),
      purge: () => purgeListItem(item.id),
    });
  };

  const openEdit = () => router.push({ pathname: "/list/[id]/edit", params: { id } });

  // Flacher Inhalt für den ScrollView, damit Überschriften sticky sind und Zeilen animiert gleiten
  const children: React.ReactNode[] = [];
  const stickyIndices: number[] = [];
  for (const group of groups) {
    if (isComplete(group) && !expanded.has(group.categoryId)) {
      children.push(
        <StyledAnimatedView
          key={`collapsed:${group.categoryId}`}
          layout={ROW_TRANSITION}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <CollapsedCategory
            name={group.categoryName}
            done={group.checkedCount}
            total={group.items.length}
            onExpand={() => expand(group.categoryId)}
          />
        </StyledAnimatedView>
      );
      continue;
    }

    stickyIndices.push(children.length);
    children.push(<SectionHeader key={`header:${group.categoryId}`} title={group.categoryName} />);
    for (const item of group.items) {
      children.push(
        <StyledAnimatedView key={item.id} layout={ROW_TRANSITION} entering={FadeIn} exiting={FadeOut}>
          <SwipeRow
            label={t("common.edit")}
            icon={PencilIcon}
            tone="primary"
            actionWidth={SWIPE_ACTION_WIDTH.edit}
            onAction={() => setQuickEdit(item)}
          >
            <ShopRow
              item={item}
              onToggle={() => toggle(item)}
              onShowImage={() => setViewerItem(item)}
            />
          </SwipeRow>
        </StyledAnimatedView>
      );
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={list?.name ?? ""}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => setResetOpen(true)}
          aria-label={t("shop.resetChecks")}
        >
          <ButtonIcon as={RotateCcwIcon} />
        </Button>
        <Button variant="secondary" size="icon" onPress={openEdit} aria-label={t("shop.editList")}>
          <ButtonIcon as={PencilIcon} />
        </Button>
      </StackHeader>

      {!isPending && items.length === 0 ? (
        <EmptyState icon={ListIcon} title={t("shop.empty.title")}>
          <Button onPress={openEdit}>
            <ButtonText>{t("shop.empty.action")}</ButtonText>
          </Button>
        </EmptyState>
      ) : (
        <ScrollView stickyHeaderIndices={stickyIndices} contentContainerClassName="pb-safe">
          {children}
          {allDone ? (
            <StyledAnimatedView key="all-done" entering={FadeIn} className="px-page pb-6 pt-6">
              <View className="items-center gap-3 rounded-card border border-line bg-surface p-5">
                <View className="size-12 items-center justify-center rounded-[999px] bg-primary">
                  <Icon as={CheckIcon} size="xl" className="text-primary-ink" />
                </View>
                <Text className="text-lg font-extrabold">{t("shop.allDone")}</Text>
                {/* Setzt ohne Rückfrage zurück */}
                <Button variant="secondary" onPress={() => resetChecks.mutate(id)}>
                  <ButtonText>{t("shop.resetChecks")}</ButtonText>
                </Button>
              </View>
            </StyledAnimatedView>
          ) : null}
        </ScrollView>
      )}

      {/* Schnell-Bearbeiten (2c): gespeichert wird erst mit „Fertig“, Wegwischen verwirft */}
      <Sheet isOpen={quickEdit !== null} onDismiss={() => setQuickEdit(null)}>
        {shownQuickEdit ? (
          <ItemForm
            key={shownQuickEdit.id}
            product={{ name: shownQuickEdit.productName, categoryName: shownQuickEdit.categoryName }}
            initial={shownQuickEdit}
            submitLabel={t("common.done")}
            onSubmit={(values) => {
              updateItem.mutate({ id: shownQuickEdit.id, values });
              setQuickEdit(null);
            }}
            deleteLabel={t("itemSheet.removeItem")}
            onDelete={() => removeItem(shownQuickEdit)}
          />
        ) : null}
      </Sheet>

      <ProductPhotoViewer
        product={viewerItem ? { id: viewerItem.productId, name: viewerItem.productName } : null}
        onClose={() => setViewerItem(null)}
      />

      {/* „Alle Haken entfernen?“ (Zurücksetzen im Header) */}
      <Dialog isOpen={resetOpen} onClose={() => setResetOpen(false)}>
        <Text role="heading" className="text-xl font-extrabold">
          {t("shop.resetDialog.title")}
        </Text>
        <AlertDialogFooter>
          <Button variant="secondary" onPress={() => setResetOpen(false)}>
            <ButtonText>{t("common.cancel")}</ButtonText>
          </Button>
          <Button onPress={reset}>
            <ButtonText>{t("shop.resetDialog.confirm")}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </Dialog>
    </View>
  );
}
