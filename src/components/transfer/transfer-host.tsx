import { useEffect } from "react";

import { useAppToast } from "@/hooks/use-app-toast";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import {
  refreshTransferPresence,
  startTransferPresence,
  stopTransferPresence,
  subscribeTransferNotices,
  type TransferNotice,
} from "@/lib/transfer/session";

function noticeTitle(notice: TransferNotice): string {
  switch (notice.kind) {
    case "withdrawn":
      return t("receive.withdrawn");
    case "receiveFailed":
      return t("receive.failed");
    case "notReady":
      return t("transfer.notReadyHint");
    case "fileUnreadable":
      return t("transfer.fileUnreadable");
  }
}

/**
 * Sichtbarkeit im Netzwerk, solange Basko offen ist (Spezifikation → 6 → Sichtbarkeit), und
 * Hinweise des Transfers als Toast. Einmal im Root-Layout, innerhalb des Toast-Hosts.
 */
export function TransferHost() {
  const showToast = useAppToast();
  const { deviceName } = useSettings();

  useEffect(() => {
    startTransferPresence();
    return stopTransferPresence;
  }, []);

  // Ein neuer Gerätename wird sofort neu veröffentlicht
  useEffect(() => {
    refreshTransferPresence();
  }, [deviceName]);

  useEffect(
    () => subscribeTransferNotices((notice) => showToast({ title: noticeTitle(notice) })),
    [showToast]
  );

  return null;
}
