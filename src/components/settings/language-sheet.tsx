import { SmartphoneIcon } from "lucide-react-native";

import { t, type LanguageSetting } from "@/lib/i18n";

import { ChoiceSheet, type Choice } from "./choice-sheet";

interface LanguageSheetProps {
  isOpen: boolean;
  value: LanguageSetting;
  onClose: () => void;
  /** Nach der Schließ-Animation – erst dann wird umgestellt (die Screens hängen sich neu ein). */
  onClosed: () => void;
  onSelect: (language: LanguageSetting) => void;
}

/** Flaggen der Sprachen; „System“ zeigt das Handy wie bei der Darstellung. Englisch = britisch (en-GB). */
const LANGUAGE_FLAGS: Record<Exclude<LanguageSetting, "system">, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
};

/** Sprache wählen (8a): System, Deutsch, English – Haken an der gewählten. */
export function LanguageSheet({ isOpen, value, onClose, onClosed, onSelect }: LanguageSheetProps) {
  const choices: Choice<LanguageSetting>[] = [
    { value: "system", label: t("settings.languages.system"), icon: SmartphoneIcon },
    { value: "de", label: t("settings.languages.de"), flag: LANGUAGE_FLAGS.de },
    { value: "en", label: t("settings.languages.en"), flag: LANGUAGE_FLAGS.en },
  ];

  return (
    <ChoiceSheet
      isOpen={isOpen}
      title={t("settings.language")}
      choices={choices}
      value={value}
      onClose={onClose}
      onClosed={onClosed}
      onSelect={onSelect}
    />
  );
}
