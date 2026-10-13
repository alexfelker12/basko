import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ScreenPattern } from "@/components/screen-pattern";
import { SegmentedControl } from "@/components/segmented-control";
import { DeviceNameDialog } from "@/components/settings/device-name-dialog";
import { LanguageSheet } from "@/components/settings/language-sheet";
import { SettingsRow } from "@/components/settings/settings-row";
import { StackHeader } from "@/components/stack-header";
import { useAppToast } from "@/hooks/use-app-toast";
import { useChangeLanguage, useSettings, useUpdateSetting } from "@/hooks/use-settings";
import { t, type LanguageSetting } from "@/lib/i18n";
import { THEME_MODES } from "@/lib/theme";

/**
 * Einstellungen (8a): Ladenreihenfolge, Gerätename, Darstellung (wirkt sofort), Sprache,
 * Daten & Sicherung und „Über die App“ mit Version und Quellenangabe.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { deviceName, theme, language } = useSettings();
  const updateSetting = useUpdateSetting();
  const changeLanguage = useChangeLanguage("/settings");
  const showToast = useAppToast();
  const [renaming, setRenaming] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  /** Gewählte Sprache – umgestellt wird erst, wenn das Sheet zu ist. */
  const [nextLanguage, setNextLanguage] = useState<LanguageSetting | null>(null);

  const themeOptions = THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`settings.themes.${mode}`),
  }));

  const saveDeviceName = (name: string) => {
    setRenaming(false);
    updateSetting.mutate(
      { key: "deviceName", value: name },
      { onError: () => showToast({ title: t("errors.generic") }) }
    );
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Hintergrundmuster (Punktraster) hinter dem Inhalt */}
      <ScreenPattern />
      <StackHeader title={t("settings.title")} />
      <View className="mx-page border-t border-line">
        <SettingsRow
          title={t("settings.storeOrder")}
          onPress={() => router.push("/settings/store-order")}
        />
        <SettingsRow
          title={t("settings.deviceName")}
          value={deviceName}
          onPress={() => setRenaming(true)}
        />
        <SettingsRow title={t("settings.appearance")}>
          <SegmentedControl
            options={themeOptions}
            value={theme}
            onChange={(value) => updateSetting.mutate({ key: "theme", value })}
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.language")}
          value={t(`settings.languages.${language}`)}
          onPress={() => setLanguageOpen(true)}
        />
        <SettingsRow title={t("settings.backup")} onPress={() => router.push("/settings/backup")} />
        <SettingsRow
          title={t("settings.about")}
          subtitle={t("settings.recipeSource")}
          value={t("settings.version", { version: Constants.expoConfig?.version ?? "–" })}
        />
      </View>
      <LanguageSheet
        isOpen={languageOpen}
        value={language}
        onClose={() => setLanguageOpen(false)}
        onSelect={(selected) => {
          setLanguageOpen(false);
          if (selected !== language) setNextLanguage(selected);
        }}
        onClosed={() => {
          if (!nextLanguage) return;
          setNextLanguage(null);
          changeLanguage(nextLanguage);
        }}
      />
      <DeviceNameDialog
        isOpen={renaming}
        name={deviceName}
        onClose={() => setRenaming(false)}
        onSave={saveDeviceName}
      />
    </View>
  );
}
