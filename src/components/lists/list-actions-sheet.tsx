import {
  CopyIcon,
  PencilIcon,
  ShareIcon,
  TextCursorInputIcon,
  Trash2Icon,
  WifiIcon,
} from "lucide-react-native";
import { View } from "react-native";

import { ActionItem } from "@/components/action-item";
import { Sheet } from "@/components/sheet";
import { useLastDefined } from "@/hooks/use-last-defined";
import { t } from "@/lib/i18n";
import type { ListSummary } from "@/lib/queries/lists";

import { ListRowContent } from "./list-row";

interface ListActionsSheetProps {
  list: ListSummary | null;
  onClose: () => void;
  /** Nach der Schließ-Animation (z. B. um danach das Teilen-Menü zu öffnen). */
  onClosed?: () => void;
  onEdit: () => void;
  onRename: () => void;
  onSend: () => void;
  onExport: () => void;
  /** Die Exportdatei wird gerade erstellt – Spinner in der Zeile, das Menü bleibt offen. */
  exporting: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** „···“-Menü (1e). */
export function ListActionsSheet({
  list,
  onClose,
  onClosed,
  onEdit,
  onRename,
  onSend,
  onExport,
  exporting,
  onDuplicate,
  onDelete,
}: ListActionsSheetProps) {
  const shownList = useLastDefined(list);

  return (
    <Sheet isOpen={list !== null} onDismiss={onClose} onClosed={onClosed}>
      {shownList ? (
        <View className="pb-2">
          <View className="mb-1 border-b border-line px-page pb-3.5 pt-2">
            <ListRowContent
              name={shownList.name}
              color={shownList.color}
              itemCount={shownList.itemCount}
              large
            />
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
            onPress={onSend}
          />
          <ActionItem
            icon={ShareIcon}
            title={t("listActions.export.title")}
            description={t("listActions.export.description")}
            onPress={onExport}
            loading={exporting}
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
