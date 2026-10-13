import { count, eq } from "drizzle-orm";

import { DEFAULT_CATEGORY_KEYS, SYSTEM_CATEGORY_KEY } from "@/lib/category-name";
import { t } from "@/lib/i18n";

import type { Database } from ".";
import { newId } from "./id";
import { category } from "./schema";

/**
 * Legt beim ersten Start die Standard-Kategorien an und stellt sicher,
 * dass die Systemkategorie „Sonstiges“ immer existiert. Synchron und idempotent.
 */
export function seedDatabase(db: Database) {
  db.transaction((tx) => {
    const [{ value: categoryCount }] = tx.select({ value: count() }).from(category).all();

    if (categoryCount === 0) {
      tx.insert(category)
        .values(
          DEFAULT_CATEGORY_KEYS.map((key, index) => ({
            id: newId(),
            name: t(`seed.categories.${key}`),
            sortOrder: index,
            isSystem: false,
            key,
          }))
        )
        .run();
    }

    const system = tx
      .select({ id: category.id })
      .from(category)
      .where(eq(category.isSystem, true))
      .get();

    if (!system) {
      // sortOrder ist für „Sonstiges“ ohne Bedeutung – sie steht über `isSystem` immer am Ende.
      tx.insert(category)
        .values({
          id: newId(),
          name: t("seed.categories.other"),
          sortOrder: Number.MAX_SAFE_INTEGER,
          isSystem: true,
          key: SYSTEM_CATEGORY_KEY,
        })
        .run();
    }
  });
}
