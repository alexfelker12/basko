import {
  CopyIcon,
  PencilIcon,
  ShareIcon,
  TextCursorInputIcon,
  Trash2Icon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";
import type { ListSummary } from "@/lib/queries/lists";
import { cn } from "@gluestack-ui/utils/nativewind-utils";

import { ListRowContent } from "./list-row";

interface ActionItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function ActionItem({ icon, title, description, onPress, danger, disabled }: ActionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role="button"
      aria-disabled={disabled}
      className={cn(
        "min-h-14 flex-row items-center gap-3.5 px-page py-2 active:bg-chip",
        disabled && "opacity-40"
      )}
    >
      <View className="size-9 items-center justify-center rounded-[999px] bg-chip">
        <Icon as={icon} className={cn("h-4.5 w-4.5", danger ? "text-danger" : "text-ink")} />
      </View>
      <View className="flex-1">
        <Text className={cn("text-base font-bold", danger && "text-danger")}>{title}</Text>
        {description ? <Text className="text-xs text-soft">{description}</Text> : null}
      </View>
    </Pressable>
  );
}

interface ListActionsSheetProps {
  list: ListSummary | null;
  onClose: () => void;
  onEdit: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * „···“-Menü (1e). „Über Netzwerk senden“ und „Als Datei exportieren“ sind bis Phase 4
 * sichtbar, aber deaktiviert.
 */
export function ListActionsSheet({
  list,
  onClose,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
}: ListActionsSheetProps) {
  return (
    <Sheet isOpen={list !== null} onClose={onClose}>
      {list ? (
        <View className="pb-2">
          <View className="mb-1 border-b border-line px-page pb-3.5 pt-2">
            <ListRowContent name={list.name} color={list.color} itemCount={list.itemCount} large />
          </View>
          <ActionItem
            icon={PencilIcon}
            title={t("listActions.edit.title")}
            description={t("listActions.edit.description")}
            onPress={onEdit}
          />
          <ActionItem icon={TextCursorInputIcon} title={t("listActions.rename.title")} onPress={onRename} />
          <ActionItem
            icon={WifiIcon}
            title={t("listActions.send.title")}
            description={t("listActions.send.description")}
            onPress={onClose}
            disabled
          />
          <ActionItem
            icon={ShareIcon}
            title={t("listActions.export.title")}
            description={t("listActions.export.description")}
            onPress={onClose}
            disabled
          />
          <ActionItem
            icon={CopyIcon}
            title={t("listActions.duplicate.title")}
            description={t("listActions.duplicate.description")}
            onPress={onDuplicate}
          />
          <ActionItem icon={Trash2Icon} title={t("listActions.delete.title")} onPress={onDelete} danger />
        </View>
      ) : null}
    </Sheet>
  );
}
