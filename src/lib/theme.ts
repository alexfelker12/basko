import { Appearance } from "react-native";

/** Darstellung in den Einstellungen (8a): Hell / System / Dunkel. */
export const THEME_MODES = ["light", "system", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/**
 * Setzt das Farbschema der App. NativeWind koppelt `@media (prefers-color-scheme: dark)`
 * an `Appearance`, dadurch wechseln alle Tokens in `global.css` sofort.
 * „system“ hebt die Übersteuerung auf und folgt wieder dem Gerät.
 */
export function applyColorScheme(mode: ThemeMode) {
  Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
}
