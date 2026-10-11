import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";

interface ErrorScreenProps {
  message?: string;
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-bg px-8">
      <Text className="text-base font-bold text-danger">{t("errors.generic")}</Text>
      {message ? (
        <Text className="text-center text-sm text-soft">{message}</Text>
      ) : null}
    </View>
  );
}
