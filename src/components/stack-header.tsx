import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Button, ButtonIcon } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { t } from "@/lib/i18n";

interface StackHeaderProps {
  /** Ohne Titel nur ‹ (Rezept-Details 7d: der Titel steht groß im Inhalt). */
  title?: string;
  /** Aktionen rechts (runde Icon-Buttons). */
  children?: ReactNode;
}

/** Kopf der Stack-Screens (2a, 3a): ‹ auf `chip`, Titel 20 / 800. ‹ führt immer dorthin zurück, woher man kam. */
export function StackHeader({ title, children }: StackHeaderProps) {
  const router = useRouter();

  return (
    <View className="pt-safe">
      <View className="h-15 flex-row items-center gap-1.5 px-page">
        <Button
          variant="secondary"
          size="icon"
          onPress={() => router.back()}
          aria-label={t("common.back")}
        >
          <ButtonIcon as={ChevronLeftIcon} />
        </Button>
        {title ? (
          <Text
            role="heading"
            numberOfLines={1}
            className="ml-1.5 flex-1 text-xl font-extrabold tracking-[-0.2px]"
          >
            {title}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        {children}
      </View>
    </View>
  );
}
