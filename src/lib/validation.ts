import { z } from "zod";

import { LIST_ITEM_NOTE_MAX } from "@/lib/db/schema";
import { LIST_COLORS } from "@/lib/list-colors";
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
