import { z } from "zod";

import {
  CATEGORY_NAME_MAX,
  LIST_ITEM_NOTE_MAX,
  PRODUCT_IMAGES_MAX,
  PRODUCT_NAME_MAX,
} from "@/lib/db/schema";
import { LIST_COLORS } from "@/lib/list-colors";
import { DEVICE_NAME_MAX } from "@/lib/settings";
import { roundQuantity, UNITS } from "@/lib/units";

/*
 * Formular-Schemas (TanStack Form + Zod). Bewusst ohne drizzle-zod: mit Zod 4.6 liefert
 * `createInsertSchema(...).pick(...)` unbrauchbare Typen (`[x: string]: any`). Die Grenzen
 * kommen aus denselben Konstanten wie das DB-Schema.
 */

/** Neue Liste (1f): Name nicht leer, Farbe aus den 5 Listenfarben. */
export const listFormSchema = z.object({
  name: z.string().trim().min(1),
  color: z.enum(LIST_COLORS),
});

export type ListFormValues = z.input<typeof listFormSchema>;

/**
 * Listeneintrag (3e, 2c): Menge > 0 mit höchstens 2 Nachkommastellen, feste Einheit,
 * Notiz max. 100 Zeichen (leer = keine Notiz).
 */
export const itemFormSchema = z.object({
  quantity: z
    .number()
    .positive()
    .refine((value) => roundQuantity(value) === value),
  unit: z.enum(UNITS),
  note: z.string().max(LIST_ITEM_NOTE_MAX),
});

export type ItemFormValues = z.input<typeof itemFormSchema>;

/**
 * Produkt (4d): Name max. 100 Zeichen, Kategorie Pflicht, max. 8 Fotos. Leere Namen grauen nur den
 * Knopf aus (ohne Text); „gibt es schon“ prüft das Formular gegen den Katalog.
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, "").max(PRODUCT_NAME_MAX),
  categoryId: z.string().min(1, ""),
  photos: z
    .array(z.object({ key: z.string(), uri: z.string(), fileName: z.string().nullable() }))
    .max(PRODUCT_IMAGES_MAX),
});

export type ProductFormValues = z.input<typeof productFormSchema>;

/** Kategorie (5a Umbenennen, 5c Neu): Name nicht leer, max. 40 Zeichen, eindeutig (prüft das Formular). */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "").max(CATEGORY_NAME_MAX),
});

export type CategoryFormValues = z.input<typeof categoryFormSchema>;

/** Gerätename (8b): nicht leer, max. 30 Zeichen. Leer graut nur „Speichern“ aus, ohne Meldung. */
export const deviceNameFormSchema = z.object({
  name: z.string().trim().min(1, "").max(DEVICE_NAME_MAX),
});

export type DeviceNameFormValues = z.input<typeof deviceNameFormSchema>;

/**
 * Einkaufsliste aus einem Rezept (7e): Listenname nicht leer (Namensregel „(n)“ beim Anlegen),
 * je Zutat Auswahl und bearbeitbarer Name (max. 100). Zeilen ohne Namen werden übergangen;
 * „Erstellen“ braucht mindestens eine gewählte Zutat mit Namen (prüft das Formular).
 */
export const recipeListFormSchema = z.object({
  name: z.string().trim().min(1, ""),
  ingredients: z.array(
    z.object({
      key: z.string(),
      selected: z.boolean(),
      name: z.string().max(PRODUCT_NAME_MAX),
    })
  ),
});

export type RecipeListFormValues = z.input<typeof recipeListFormSchema>;
