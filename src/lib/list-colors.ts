/**
 * Listenfarben (Spezifikation → Datenmodell `list.color`).
 * Grün folgt dem `primary`-Token (hell/dunkel), Amber und Rot sind `amber`/`danger`,
 * Blau und Lila sind in beiden Modi gleich und zentral in `global.css` definiert.
 */
export const LIST_COLORS = ["green", "amber", "red", "blue", "purple"] as const;
export type ListColor = (typeof LIST_COLORS)[number];

/** Grün ist beim Anlegen immer vorausgewählt (1f), Rezept-Listen werden Lila (7). */
export const DEFAULT_LIST_COLOR: ListColor = "green";
export const RECIPE_LIST_COLOR: ListColor = "purple";

/** Hintergrund-Klasse je Listenfarbe – als vollständige Klassen, damit Tailwind sie findet. */
export const LIST_COLOR_BG: Record<ListColor, string> = {
  green: "bg-primary",
  amber: "bg-amber",
  red: "bg-danger",
  blue: "bg-list-blue",
  purple: "bg-list-purple",
};
