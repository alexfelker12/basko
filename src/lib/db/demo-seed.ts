import { eq } from "drizzle-orm";

import { t } from "@/lib/i18n";
import type { ListColor } from "@/lib/list-colors";
import { normalizeName } from "@/lib/names";
import { addListItem, setListItemChecked } from "@/lib/queries/list-items";
import { createList } from "@/lib/queries/lists";
import type { Unit } from "@/lib/units";

import type { Database } from ".";
import { newId } from "./id";
import { category, list, product, settings } from "./schema";

/**
 * Testdaten für die Entwicklung (nur `__DEV__`): ca. 30 Produkte und 5 Einkaufslisten mit Notizen.
 * Läuft einmal pro Gerät – danach steht `DEMO_SEED_KEY` in `settings`. Zum erneuten Einspielen
 * den Eintrag löschen (oder die App-Daten zurücksetzen). Vorhandene Produkte (gleicher Name)
 * werden wiederverwendet, nichts wird überschrieben. Fotos fügt man selbst hinzu.
 * Bewusst keine i18n: Das sind Daten, keine UI-Texte.
 */
export const DEMO_SEED_KEY = "dev.demoSeedVersion";
const DEMO_SEED_VERSION = 1;

type CategoryKey =
  | "produce"
  | "bakery"
  | "chilled"
  | "meatFish"
  | "frozen"
  | "drinks"
  | "drugstore"
  | "household"
  | "other";

const PRODUCTS: [name: string, category: CategoryKey][] = [
  ["Äpfel", "produce"],
  ["Bananen", "produce"],
  ["Tomaten", "produce"],
  ["Gurke", "produce"],
  ["Paprika", "produce"],
  ["Zwiebeln", "produce"],
  ["Kartoffeln", "produce"],
  ["Zitronen", "produce"],
  ["Eisbergsalat", "produce"],
  ["Vollkornbrot", "bakery"],
  ["Brötchen", "bakery"],
  ["Milch", "chilled"],
  ["Butter", "chilled"],
  ["Joghurt", "chilled"],
  ["Eier", "chilled"],
  ["Gouda", "chilled"],
  ["Parmesan", "chilled"],
  ["Frischkäse", "chilled"],
  ["Hähnchenbrust", "meatFish"],
  ["Hackfleisch", "meatFish"],
  ["Lachsfilet", "meatFish"],
  ["Erbsen", "frozen"],
  ["Pizza Margherita", "frozen"],
  ["Mineralwasser", "drinks"],
  ["Orangensaft", "drinks"],
  ["Apfelschorle", "drinks"],
  ["Zahnpasta", "drugstore"],
  ["Duschgel", "drugstore"],
  ["Spülmittel", "household"],
  ["Küchenrolle", "household"],
  ["Müllbeutel", "household"],
  ["Spaghetti", "other"],
  ["Olivenöl", "other"],
  ["Kaffee", "other"],
  ["Haferflocken", "other"],
];

type DemoItem = [product: string, quantity: number, unit: Unit, note?: string, checked?: boolean];

/** In umgekehrter Reihenfolge angelegt, damit „Wocheneinkauf“ als zuletzt benutzte oben steht. */
const LISTS: { name: string; color: ListColor; items: DemoItem[] }[] = [
  {
    name: "Drogerie & Haushalt",
    color: "blue",
    items: [
      ["Zahnpasta", 2, "tube"],
      ["Duschgel", 1, "bottle", "für sensible Haut"],
      ["Spülmittel", 1, "bottle"],
      ["Müllbeutel", 1, "roll", "35 l, mit Zugband"],
      ["Küchenrolle", 1, "pack"],
    ],
  },
  {
    name: "Frühstück am Wochenende",
    color: "purple",
    items: [
      ["Brötchen", 6, "pcs", "4 normale, 2 Körnerbrötchen"],
      ["Eier", 6, "pcs"],
      ["Orangensaft", 1, "l", "ohne Fruchtfleisch"],
      ["Frischkäse", 1, "cup"],
      ["Butter", 1, "pcs"],
      ["Haferflocken", 500, "g", "kernig"],
    ],
  },
  {
    name: "Pasta-Abend",
    color: "red",
    items: [
      ["Spaghetti", 2, "pack"],
      ["Hackfleisch", 500, "g", "gemischt"],
      ["Tomaten", 800, "g", "reife, für die Soße"],
      ["Zwiebeln", 2, "pcs"],
      ["Parmesan", 150, "g", "am Stück"],
      ["Olivenöl", 1, "bottle"],
      ["Eisbergsalat", 1, "pcs"],
    ],
  },
  {
    name: "Grillabend Samstag",
    color: "amber",
    items: [
      ["Hähnchenbrust", 1, "kg", "für Spieße, schon marinieren"],
      ["Paprika", 3, "pcs", "rot und gelb"],
      ["Zwiebeln", 1, "net"],
      ["Brötchen", 8, "pcs"],
      ["Eisbergsalat", 1, "pcs"],
      ["Apfelschorle", 2, "crate"],
      ["Zitronen", 2, "pcs", "für die Marinade"],
    ],
  },
  {
    name: "Wocheneinkauf",
    color: "green",
    items: [
      ["Milch", 2, "l", "fettarm 1,5 %"],
      ["Butter", 1, "pcs", undefined, true],
      ["Eier", 10, "pcs", "Bio, Freilandhaltung"],
      ["Joghurt", 4, "cup", "Natur"],
      ["Gouda", 200, "g", "in Scheiben"],
      ["Äpfel", 1, "kg", "Elstar oder Braeburn", true],
      ["Bananen", 6, "pcs", "nicht zu reif"],
      ["Tomaten", 500, "g"],
      ["Gurke", 1, "pcs", undefined, true],
      ["Kartoffeln", 2, "kg", "festkochend"],
      ["Vollkornbrot", 1, "pcs"],
      ["Erbsen", 1, "pack"],
      ["Pizza Margherita", 2, "pcs"],
      ["Lachsfilet", 2, "pcs", "TK geht auch"],
      ["Mineralwasser", 2, "crate", "Medium"],
      ["Kaffee", 500, "g", "ganze Bohnen"],
      ["Küchenrolle", 1, "pack"],
    ],
  },
];

/** Spielt die Testdaten ein, falls noch nicht geschehen. Synchron, nur in der Entwicklung aufrufen. */
export function seedDemoData(db: Database) {
  const marker = db.select().from(settings).where(eq(settings.key, DEMO_SEED_KEY)).get();
  if (marker) return;

  // Kategorien über die Seed-Namen finden; umbenannte/gelöschte fallen auf „Sonstiges“ zurück
  const categories = db.select().from(category).all();
  const systemId = categories.find((row) => row.isSystem)?.id;
  if (!systemId) return;
  const categoryId = (key: CategoryKey) => {
    const name = normalizeName(t(`seed.categories.${key}`));
    return categories.find((row) => normalizeName(row.name) === name)?.id ?? systemId;
  };

  // Produkte: vorhandene (gleicher Name) wiederverwenden
  const productIds = new Map<string, string>();
  for (const row of db.select({ id: product.id, name: product.name }).from(product).all()) {
    productIds.set(normalizeName(row.name), row.id);
  }
  db.transaction(() => {
    for (const [name, key] of PRODUCTS) {
      if (productIds.has(normalizeName(name))) continue;
      const id = newId();
      db.insert(product)
        .values({ id, name, categoryId: categoryId(key), createdAt: new Date() })
        .run();
      productIds.set(normalizeName(name), id);
    }
  });

  // Listen nacheinander anlegen; jede Aktion setzt `lastUsedAt`, die letzte steht oben
  for (const demo of LISTS) {
    const listId = createList(demo.name, demo.color);
    for (const [name, quantity, unit, note, checked] of demo.items) {
      const productId = productIds.get(normalizeName(name));
      if (!productId) continue;
      const itemId = addListItem(listId, productId, { quantity, unit, note: note ?? null });
      if (checked) setListItemChecked(itemId, true);
    }
    // Gleiche Millisekunde vermeiden, damit die Reihenfolge stabil ist
    const usedAt = new Date(Date.now() + LISTS.indexOf(demo));
    db.update(list).set({ lastUsedAt: usedAt }).where(eq(list.id, listId)).run();
  }

  db.insert(settings).values({ key: DEMO_SEED_KEY, value: DEMO_SEED_VERSION }).run();
}
