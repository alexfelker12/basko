import { z } from "zod";

import {
  CATEGORY_NAME_MAX,
  LIST_ITEM_NOTE_MAX,
  PRODUCT_IMAGES_MAX,
  PRODUCT_NAME_MAX,
} from "@/lib/db/schema";
import { t, type TranslationKey } from "@/lib/i18n";
import { LIST_COLORS } from "@/lib/list-colors";
import { DEVICE_NAME_MAX } from "@/lib/settings";
import { roundQuantity, UNITS } from "@/lib/units";

/*
 * Formular-Schemas (TanStack Form + Zod). Bewusst ohne drizzle-zod: mit Zod 4.6 liefert
 * `createInsertSchema(...).pick(...)` unbrauchbare Typen (`[x: string]: any`). Die Grenzen
 * kommen aus denselben Konstanten wie das DB-Schema.
 *
 * Fehlertexte kommen immer aus der i18n-Schicht (`validation.*`), nie aus Zod: je Regel ein
 * eigener Text, sonst greift `customError` unten. Als Funktion, damit sie beim Prüfen in der
 * aktiven Sprache entstehen (nicht beim Laden des Moduls).
 */

/** Eigener Fehlertext für eine Regel, z. B. `.min(1, message("validation.listName"))`. */
function message(key: TranslationKey, params?: Record<string, number>) {
  return { error: () => t(key, params) };
}

/** Rückfall für Regeln ohne eigenen Text – auch Transfer, Sicherung und Rezept-API. */
z.config({
  customError: (issue) => {
    if (issue.code === "too_small" && issue.origin === "string" && Number(issue.minimum) <= 1) {
      return t("validation.required");
    }
    if (issue.code === "too_big" && issue.origin === "string") {
      return t("validation.tooLong", { count: Number(issue.maximum) });
    }
    return t("validation.invalid");
  },
});

/** Neue Liste (1f): Name nicht leer, Farbe aus den 5 Listenfarben. */
export const listFormSchema = z.object({
  name: z.string().trim().min(1, message("validation.listName")),
  color: z.enum(LIST_COLORS, message("validation.color")),
});

export type ListFormValues = z.input<typeof listFormSchema>;

/**
 * Listeneintrag (3e, 2c): Menge > 0 mit höchstens 2 Nachkommastellen, feste Einheit,
 * Notiz max. 100 Zeichen (leer = keine Notiz).
 */
export const itemFormSchema = z.object({
  quantity: z
    .number(message("validation.quantity"))
    .positive(message("validation.quantity"))
    .refine((value) => roundQuantity(value) === value, message("validation.quantityDecimals")),
  unit: z.enum(UNITS, message("validation.unit")),
  note: z.string().max(LIST_ITEM_NOTE_MAX),
});

export type ItemFormValues = z.input<typeof itemFormSchema>;

/**
 * Produkt (4d): Name max. 100 Zeichen, Kategorie Pflicht, max. 8 Fotos. „Gibt es schon“ prüft das
 * Formular gegen den Katalog.
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, message("validation.productName")).max(PRODUCT_NAME_MAX),
  categoryId: z.string().min(1, message("validation.category")),
  photos: z
    .array(z.object({ key: z.string(), uri: z.string(), fileName: z.string().nullable() }))
    .max(PRODUCT_IMAGES_MAX, message("validation.tooManyPhotos", { count: PRODUCT_IMAGES_MAX })),
});

export type ProductFormValues = z.input<typeof productFormSchema>;

/** Kategorie (5a Umbenennen, 5c Neu): Name nicht leer, max. 40 Zeichen, eindeutig (prüft das Formular). */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, message("validation.categoryName")).max(CATEGORY_NAME_MAX),
});

export type CategoryFormValues = z.input<typeof categoryFormSchema>;

/** Gerätename (8b): nicht leer, max. 30 Zeichen. */
export const deviceNameFormSchema = z.object({
  name: z.string().trim().min(1, message("validation.deviceName")).max(DEVICE_NAME_MAX),
});

export type DeviceNameFormValues = z.input<typeof deviceNameFormSchema>;

/**
 * Einkaufsliste aus einem Rezept (7e): Listenname nicht leer (Namensregel „(n)“ beim Anlegen),
 * je Zutat Auswahl und bearbeitbarer Name (max. 100). Zeilen ohne Namen werden übergangen;
 * „Erstellen“ braucht mindestens eine gewählte Zutat mit Namen (prüft das Formular).
 */
export const recipeListFormSchema = z.object({
  name: z.string().trim().min(1, message("validation.listName")),
  ingredients: z.array(
    z.object({
      key: z.string(),
      selected: z.boolean(),
      name: z.string().max(PRODUCT_NAME_MAX),
    })
  ),
});

export type RecipeListFormValues = z.input<typeof recipeListFormSchema>;
