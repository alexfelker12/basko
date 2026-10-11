import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { ImportFlow } from "@/components/transfer/import-flow";
import { RequestDialog } from "@/components/transfer/request-dialog";
import { TransferStatusScreen } from "@/components/transfer/status-screen";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSettings } from "@/hooks/use-settings";
import { useTransfer } from "@/hooks/use-transfer";
import { t } from "@/lib/i18n";
import {
  acceptRequest,
  clearPendingImport,
  rejectRequest,
  startReceiving,
  stopReceiving,
} from "@/lib/transfer/session";

/**
 * Empfangen (6f–6i): Solange der Screen offen ist, ist das Gerät „Bereit“. Anfragen erscheinen als
 * Dialog (6g), nach dem Annehmen folgen Vorschau (6h) und Konflikte (6i). Nach dem Speichern
 * ersetzt „Liste gespeichert“ (6j) diesen Screen – damit endet die Sichtbarkeit. Nach „Verwerfen“
 * bleibt das Gerät sichtbar.
 */
export default function ReceiveScreen() {
  const router = useRouter();
  const { deviceName } = useSettings();
  const { receive, pendingImport } = useTransfer();

  useEffect(() => {
    startReceiving();
    return stopReceiving;
  }, []);

  const receiving = receive.phase === "receiving" ? receive : null;

  return (
    <View className="flex-1 bg-bg">
      {receiving ? (
        <TransferStatusScreen
          visual={{ kind: "spinner" }}
          title={t("receive.receiving.title")}
          text={t("receive.receiving.text", {
            name: receiving.listName,
            device: receiving.peerName,
          })}
        />
      ) : (
        <TransferStatusScreen
          visual={{ kind: "spinner" }}
          title={t("receive.title")}
          text={t("receive.seenAs")}
          extra={
            <View className="rounded-[999px] bg-chip px-3.5 py-1.5">
              <Text className="text-sm font-bold">{deviceName}</Text>
            </View>
          }
        >
          <Button variant="secondary" onPress={() => router.back()}>
            <ButtonText>{t("common.cancel")}</ButtonText>
          </Button>
        </TransferStatusScreen>
      )}

      <RequestDialog
        request={receive.phase === "request" ? receive : null}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />

      <ImportFlow
        pending={pendingImport?.source.kind === "network" ? pendingImport : null}
        onDiscard={(pending) => clearPendingImport(pending.id)}
        onSaved={(name) => router.replace({ pathname: "/transfer/saved", params: { name } })}
      />
    </View>
  );
}
