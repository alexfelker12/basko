import { useLocalSearchParams } from "expo-router";
import { CheckIcon, ListIcon, SearchIcon, Trash2Icon } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { LinearTransition } from "react-native-reanimated";

import { EmptyState } from "@/components/empty-state";
import { KeyboardSpacer } from "@/components/keyboard-spacer";
import { KeyboardSticky } from "@/components/keyboard-sticky";
import { AddItemsSheets, type AddItemsStep } from "@/components/items/add-items-sheet";
import { ListColorDialog } from "@/components/lists/list-color-dialog";
import { QuantityStepper } from "@/components/quantity-stepper";
import { SectionHeader } from "@/components/section-header";
import { StackHeader } from "@/components/stack-header";
import { SWIPE_ACTION_WIDTH, SwipeRow } from "@/components/swipe-row";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { StyledAnimatedView } from "@/components/ui/utils/animated";
import { useScrollFocusedInputIntoView } from "@/hooks/use-keyboard";
import { useListItems, useUpdateListItem } from "@/hooks/use-list-items";
import { useListSummary, useSetListColor } from "@/hooks/use-lists";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { unitLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { groupListItems, stickyHeaderIndices } from "@/lib/list-grouping";
import { LIST_COLOR_BG } from "@/lib/list-colors";
import {
  purgeListItem,
  restoreListItem,
  softDeleteListItem,
  type ListItemRow,
} from "@/lib/queries/list-items";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

/** Liste bearbeiten (3a–3g). Jede Änderung wird sofort gespeichert. */
export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: list } = useListSummary(id);
  const { data: items = [], isPending } = useListItems(id);
  const updateItem = useUpdateListItem();
  const setListColor = useSetListColor();
  const deleteWithUndo = useUndoableDelete();

  const [step, setStep] = useState<AddItemsStep>({ kind: "closed" });
  const [colorOpen, setColorOpen] = useState(false);

  const groups = groupListItems(items, { checkedLast: false });

  // Zahl im Mengenregler bearbeiten: die Zeile über die Tastatur scrollen (nicht bei offenem Sheet/Dialog)
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  useScrollFocusedInputIntoView(step.kind === "closed" && !colorOpen, (dy) =>
    scrollRef.current?.scrollTo({ y: scrollOffset.current + dy, animated: true })
  );

  const deleteItem = (item: ListItemRow) =>
    deleteWithUndo({
      key: `item:${item.id}`,
      title: t("common.deleted", { name: item.productName }),
      softDelete: () => softDeleteListItem(item.id),
      restore: () => restoreListItem(item.id),
      purge: () => purgeListItem(item.id),
    });

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={t("editList.title")}>
        {list ? (
          <Pressable
            onPress={() => setColorOpen(true)}
            role="button"
            aria-label={t("listColor.change")}
            className="size-11 items-center justify-center"
          >
            <View
              className={cn(
                "size-7.5 rounded-[999px] border-3 border-surface",
                LIST_COLOR_BG[list.color]
              )}
            />
          </Pressable>
        ) : null}
      </StackHeader>

      <View className="flex-row items-center gap-1.5 px-page pb-1">
        <Icon as={CheckIcon} size="xs" className="text-soft" />
        <Text className="text-xs text-soft">{t("editList.autosave")}</Text>
      </View>

      {!isPending && items.length === 0 ? (
        <EmptyState icon={ListIcon} title={t("editList.empty.title")} text={t("editList.empty.text")} />
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={stickyHeaderIndices(groups)}
          contentContainerClassName="pb-6"
        >
          {groups.flatMap((group) => [
            <SectionHeader key={`header:${group.categoryId}`} title={group.categoryName} />,
            ...group.items.map((item) => (
              <StyledAnimatedView key={item.id} layout={LinearTransition.duration(200)}>
                <SwipeRow
                  label={t("common.delete")}
                  icon={Trash2Icon}
                  tone="danger"
                  actionWidth={SWIPE_ACTION_WIDTH.delete}
                  slideOutOnFullSwipe
                  onAction={() => deleteItem(item)}
                >
                  <EditRow
                    item={item}
                    onPress={() => setStep({ kind: "edit", item, fromSearch: false })}
                    onQuantityChange={(quantity) =>
                      updateItem.mutate({ id: item.id, values: { quantity } })
                    }
                  />
                </SwipeRow>
              </StyledAnimatedView>
            )),
          ])}
          {/* Platz zum Hochscrollen, solange die Tastatur offen ist */}
          <KeyboardSpacer />
        </ScrollView>
      )}

      {/* Suchleiste unten, fest über der Tastatur (3a) */}
      <KeyboardSticky>
        <View className="bg-bg px-page pb-safe pt-2">
          <Pressable
            onPress={() => setStep({ kind: "search" })}
            role="button"
            aria-label={t("editList.searchPlaceholder")}
            className="mb-2 h-12 flex-row items-center gap-2.5 rounded-card border border-line bg-surface px-3.5"
          >
            <Icon as={SearchIcon} size="lg" className="text-soft" />
            <Text className="text-base font-semibold text-soft">
              {t("editList.searchPlaceholder")}
            </Text>
          </Pressable>
        </View>
      </KeyboardSticky>

      <AddItemsSheets
        listId={id}
        items={items}
        step={step}
        onStepChange={setStep}
        onDeleteItem={deleteItem}
      />

      {list ? (
        <ListColorDialog
          list={list}
          isOpen={colorOpen}
          onClose={() => setColorOpen(false)}
          onSave={(color) => {
            setColorOpen(false);
            setListColor.mutate({ id, color });
          }}
        />
      ) : null}
    </View>
  );
}

interface EditRowProps {
  item: ListItemRow;
  onPress: () => void;
  onQuantityChange: (quantity: number) => void;
}

/** Zeile (3a): Name, darunter „Einheit · Notiz“ (einzeilig gekürzt), rechts der Mengenregler. */
function EditRow({ item, onPress, onQuantityChange }: EditRowProps) {
  const subline = [unitLabel(item.unit), item.note].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={onPress}
      className="mx-page flex-row items-center gap-3 border-b border-line py-row active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base font-bold">
          {item.productName}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-soft">
          {subline}
        </Text>
      </View>
      <QuantityStepper value={item.quantity} unit={item.unit} onChange={onQuantityChange} />
    </Pressable>
  );
}
