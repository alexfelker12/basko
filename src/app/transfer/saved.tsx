import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckIcon } from "lucide-react-native";

import { TransferStatusScreen } from "@/components/transfer/status-screen";
import { Button, ButtonText } from "@/components/ui/button";
import { t } from "@/lib/i18n";

/** Gespeichert (6j): „‚{Liste}‘ findest du jetzt unter Listen.“ – „Fertig“ führt in den Transfer-Tab. */
export default function SavedScreen() {
  const router = useRouter();
  const { name = "" } = useLocalSearchParams<{ name?: string }>();

  return (
    <TransferStatusScreen
      visual={{ kind: "success", icon: CheckIcon }}
      title={t("importSaved.title")}
      text={t("importSaved.text", { name })}
    >
      <Button onPress={() => router.back()}>
        <ButtonText>{t("common.done")}</ButtonText>
      </Button>
    </TransferStatusScreen>
  );
}
