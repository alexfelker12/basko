import { useRouter } from "expo-router";
import { DownloadIcon } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";
import { ScreenPattern } from "@/components/screen-pattern";
import { HistoryRow } from "@/components/transfer/history-row";
import { ImportFlow } from "@/components/transfer/import-flow";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useClearTransferHistory, useTransfer, useTransferHistory } from "@/hooks/use-transfer";
import { t } from "@/lib/i18n";
import { historyListExists, type HistoryEntry } from "@/lib/queries/transfer-history";
import { clearPendingImport } from "@/lib/transfer/session";

/**
 * Transfer-Tab (6a): Karte „Auf Empfang warten“ und Verlauf. Geöffnete `.basko`-Dateien zeigen
 * hier Vorschau (6h) und Konflikte (6i).
 */
export default function TransferScreen() {
  const router = useRouter();
  const showToast = useAppToast();
  const { data: history = [] } = useTransferHistory();
  const clearHistory = useClearTransferHistory();
  const { pendingImport } = useTransfer();

  const openEntry = (entry: HistoryEntry) => {
    if (!historyListExists(entry.listId)) {
      showToast({ title: t("transfer.listMissing", { name: entry.listName }) });
      return;
    }
    // Listen-Tab mit geöffnetem „···“-Menü der Liste
    router.navigate({ pathname: "/", params: { menu: entry.listId } });
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <ScreenHeader title={t("transfer.title")} />

      <ScrollView contentContainerClassName="pb-6">
        <Pressable
          onPress={() => router.push("/transfer/receive")}
          role="button"
          className="mx-page mt-1 rounded-card bg-primary p-5 active:opacity-90"
        >
          <View className="size-12 items-center justify-center rounded-[999px] border-[1.5px] border-primary-ink/60">
            <Icon as={DownloadIcon} className="h-5.5 w-5.5 text-primary-ink" />
          </View>
          <Text className="mt-5 text-lg font-extrabold text-primary-ink">
            {t("transfer.receiveCard.title")}
          </Text>
          <Text className="mt-0.5 text-sm text-primary-ink/85">
            {t("transfer.receiveCard.text")}
          </Text>
        </Pressable>

        {history.length > 0 ? (
          <>
            <View className="mt-5 flex-row items-center justify-between pl-page pr-2">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
                {t("transfer.history")}
              </Text>
              <Button variant="link" size="sm" onPress={() => clearHistory.mutate()}>
                <ButtonText>{t("transfer.clearHistory")}</ButtonText>
              </Button>
            </View>
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} onPress={() => openEntry(entry)} />
            ))}
          </>
        ) : null}
      </ScrollView>

      <ImportFlow
        pending={pendingImport?.source.kind === "file" ? pendingImport : null}
        onDiscard={(pending) => clearPendingImport(pending.id)}
        onSaved={(name) => router.push({ pathname: "/transfer/saved", params: { name } })}
      />
    </View>
  );
}
