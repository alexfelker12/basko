import { CheckIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { LANGUAGE_SETTINGS, t, type LanguageSetting } from "@/lib/i18n";

interface LanguageSheetProps {
  isOpen: boolean;
  value: LanguageSetting;
  onClose: () => void;
  /** Nach der Schließ-Animation – erst dann wird umgestellt (die Screens hängen sich neu ein). */
  onClosed: () => void;
  onSelect: (language: LanguageSetting) => void;
}

/** Sprache wählen (8a): System, Deutsch, English – Haken an der gewählten. */
export function LanguageSheet({ isOpen, value, onClose, onClosed, onSelect }: LanguageSheetProps) {
  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} onClosed={onClosed}>
      <Text role="heading" className="px-page pb-2 pt-1 text-xl font-extrabold">
        {t("settings.language")}
      </Text>
      <View className="px-page pb-4">
        {LANGUAGE_SETTINGS.map((language) => {
          const selected = language === value;
          return (
            <Pressable
              key={language}
              onPress={() => onSelect(language)}
              role="radio"
              aria-checked={selected}
              className="min-h-12.5 flex-row items-center border-b border-line active:opacity-70"
            >
              <Text className="flex-1 text-base font-bold">
                {t(`settings.languages.${language}`)}
              </Text>
              {selected ? <Icon as={CheckIcon} size="lg" className="text-primary" /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
