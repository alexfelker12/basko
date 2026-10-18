import { MoonIcon, SmartphoneIcon, SunIcon } from "lucide-react-native";

import { t } from "@/lib/i18n";
import type { ThemeMode } from "@/lib/theme";

import { ChoiceSheet, type Choice } from "./choice-sheet";

interface ThemeSheetProps {
  isOpen: boolean;
  value: ThemeMode;
  onClose: () => void;
  /** Nach der Schließ-Animation – erst dann wird umgestellt, damit das Sheet ruhig ausfährt. */
  onClosed: () => void;
  onSelect: (theme: ThemeMode) => void;
}

/** Darstellung wählen (8a): System, Hell, Dunkel – wie die Sprache, „System“ zuerst. */
export function ThemeSheet({ isOpen, value, onClose, onClosed, onSelect }: ThemeSheetProps) {
  const choices: Choice<ThemeMode>[] = [
    { value: "system", label: t("settings.themes.system"), icon: SmartphoneIcon },
    { value: "light", label: t("settings.themes.light"), icon: SunIcon },
    { value: "dark", label: t("settings.themes.dark"), icon: MoonIcon },
  ];

  return (
    <ChoiceSheet
      isOpen={isOpen}
      title={t("settings.appearance")}
      choices={choices}
      value={value}
      onClose={onClose}
      onClosed={onClosed}
      onSelect={onSelect}
    />
  );
}
