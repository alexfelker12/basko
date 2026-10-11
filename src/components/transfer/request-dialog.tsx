import { SmartphoneIcon } from "lucide-react-native";
import { View } from "react-native";

import { Dialog } from "@/components/dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useLastDefined } from "@/hooks/use-last-defined";
import { t } from "@/lib/i18n";

type Request = { peerName: string; listName: string; itemCount: number };

interface RequestDialogProps {
  request: Request | null;
  onAccept: () => void;
  onReject: () => void;
}

/** Anfrage (6g): „{Gerät} möchte dir ‚{Liste}‘ senden“, „{n} Produkte“, Ablehnen und Annehmen. */
export function RequestDialog({ request, onAccept, onReject }: RequestDialogProps) {
  const shown = useLastDefined(request);

  return (
    // Ein versehentlicher Tipp daneben soll die Anfrage nicht ablehnen
    <Dialog isOpen={request !== null} onClose={onReject} closeOnOverlayClick={false}>
      {shown ? (
        <>
          <View className="size-11 items-center justify-center rounded-[999px] bg-chip">
            <Icon as={SmartphoneIcon} className="h-5 w-5 text-ink" />
          </View>
          <Text role="heading" className="text-lg font-extrabold">
            {t("receive.request.title", { device: shown.peerName, name: shown.listName })}
          </Text>
          <Text className="text-sm text-soft">
            {t("lists.productCount", { count: shown.itemCount })}
          </Text>
          <AlertDialogFooter>
            <Button variant="secondary" onPress={onReject}>
              <ButtonText>{t("receive.request.reject")}</ButtonText>
            </Button>
            <Button onPress={onAccept}>
              <ButtonText>{t("receive.request.accept")}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </>
      ) : null}
    </Dialog>
  );
}
