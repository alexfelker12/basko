import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckIcon,
  ChevronRightIcon,
  RotateCwIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { StackHeader } from "@/components/stack-header";
import { TransferStatusScreen } from "@/components/transfer/status-screen";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/hooks/use-app-toast";
import { useListSummary } from "@/hooks/use-lists";
import { useDiscoveredDevices, useTransfer, type DiscoveredDevice } from "@/hooks/use-transfer";
import { t } from "@/lib/i18n";
import { cancelSend, resetSend, sendList, type Peer } from "@/lib/transfer/session";

/**
 * Senden über das Netzwerk (6b–6e): Gerät wählen, auf Bestätigung warten, Ergebnis.
 * Am Ende geht es immer zurück zur Listen-Übersicht.
 */
export default function SendScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { data: list } = useListSummary(listId);
  const { send } = useTransfer();

  // Verlassen bricht eine laufende Anfrage ab und setzt das Senden zurück
  useEffect(() => resetSend, []);

  const finish = () => {
    resetSend();
    router.back();
  };

  if (send.phase === "idle" || send.listId !== listId) {
    return <DevicePicker listId={listId} listName={list?.name ?? ""} />;
  }

  const device = send.peer.name;
  switch (send.phase) {
    case "waiting":
      return (
        <TransferStatusScreen
          visual={{ kind: "spinner" }}
          title={t("sendList.waiting.title")}
          text={t("sendList.waiting.text", { device })}
        >
          <Button
            variant="secondary"
            onPress={() => {
              cancelSend();
              router.back();
            }}
          >
            <ButtonText>{t("common.cancel")}</ButtonText>
          </Button>
        </TransferStatusScreen>
      );
    case "sent":
      return (
        <TransferStatusScreen
          visual={{ kind: "success", icon: CheckIcon }}
          title={t("sendList.sent.title")}
          text={t("sendList.sent.text", { name: send.listName, device })}
        >
          <Button onPress={finish}>
            <ButtonText>{t("common.done")}</ButtonText>
          </Button>
        </TransferStatusScreen>
      );
    case "rejected":
      return (
        <TransferStatusScreen
          visual={{ kind: "warning", icon: XIcon }}
          title={t("sendList.rejected.title")}
          text={t("sendList.rejected.text", { device })}
        >
          <Button onPress={finish}>
            <ButtonText>{t("common.done")}</ButtonText>
          </Button>
        </TransferStatusScreen>
      );
    case "failed":
    case "busy": {
      const texts = send.phase === "failed" ? "sendList.failed" : "sendList.busy";
      return (
        <TransferStatusScreen
          visual={{
            kind: "warning",
            icon: send.phase === "failed" ? WifiOffIcon : TriangleAlertIcon,
          }}
          title={t(`${texts}.title`)}
          text={t(`${texts}.text`, { device })}
        >
          <Button variant="secondary" onPress={finish}>
            <ButtonText>{t("common.cancel")}</ButtonText>
          </Button>
          <Button onPress={() => sendList(send.listId, send.listName, send.peer)}>
            <ButtonText>{t("sendList.retry")}</ButtonText>
          </Button>
        </TransferStatusScreen>
      );
    }
  }
}

/** Gerät wählen (6b): einmal suchen, danach „↻ Erneut suchen“. */
function DevicePicker({ listId, listName }: { listId: string; listName: string }) {
  const showToast = useAppToast();
  const { devices, searching, rescan } = useDiscoveredDevices();

  const choose = (device: DiscoveredDevice) => {
    if (device.status !== "ready") {
      showToast({ title: t("transfer.notReadyHint") });
      return;
    }
    const peer: Peer = { key: device.key, name: device.name, host: device.host, port: device.port };
    void sendList(listId, listName, peer);
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={t("sendList.title")} />
      <Text numberOfLines={1} className="-mt-1 px-page pb-2 text-xs text-soft">
        {t("sendList.subtitle", { name: listName })}
      </Text>

      {!searching && devices.length === 0 ? (
        <EmptyState
          icon={WifiOffIcon}
          title={t("sendList.empty.title")}
          text={t("sendList.empty.text")}
        >
          <Button variant="secondary" onPress={rescan}>
            <ButtonIcon as={RotateCwIcon} />
            <ButtonText>{t("sendList.rescan")}</ButtonText>
          </Button>
        </EmptyState>
      ) : (
        <ScrollView contentContainerClassName="pb-6">
          {devices.map((device) => (
            <DeviceRow key={device.key} device={device} onPress={() => choose(device)} />
          ))}
          <View className="mt-4 h-11 items-center justify-center">
            {searching ? (
              <View className="flex-row items-center gap-2.5">
                <Spinner size="small" className="text-soft" />
                <Text className="text-sm text-soft">{t("sendList.searching")}</Text>
              </View>
            ) : (
              <Button variant="link" onPress={rescan}>
                <ButtonIcon as={RotateCwIcon} />
                <ButtonText>{t("sendList.rescan")}</ButtonText>
              </Button>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** DeviceRow (6b): Gerät, Status, ›. */
function DeviceRow({ device, onPress }: { device: DiscoveredDevice; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      className="mx-page flex-row items-center gap-3.5 border-b border-line py-row active:opacity-70"
    >
      <View className="size-10 items-center justify-center rounded-[999px] bg-chip">
        <Icon as={SmartphoneIcon} className="h-5 w-5 text-ink" />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base font-bold">
          {device.name}
        </Text>
        <Text className="mt-0.5 text-xs text-soft">{t(`transfer.status.${device.status}`)}</Text>
      </View>
      <Icon as={ChevronRightIcon} className="h-5 w-5 text-soft" />
    </Pressable>
  );
}
