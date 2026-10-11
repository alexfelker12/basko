import { collator } from "@/lib/i18n";
import type { ListItemRow } from "@/lib/queries/list-items";

export type CategoryGroup = {
  categoryId: string;
  categoryName: string;
  items: ListItemRow[];
  checkedCount: number;
};

/**
 * Gruppierung für Einkaufsmodus (2) und Bearbeiten (3): Kategorien in Ladenreihenfolge,
 * „Sonstiges“ zuletzt, darin alphabetisch. Im Einkaufsmodus stehen offene vor erledigten.
 */
export function groupListItems(
  items: ListItemRow[],
  { checkedLast }: { checkedLast: boolean }
): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup & { isSystem: boolean; sortOrder: number }>();

  for (const item of items) {
    let group = groups.get(item.categoryId);
    if (!group) {
      group = {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        isSystem: item.categoryIsSystem,
        sortOrder: item.categorySortOrder,
        items: [],
        checkedCount: 0,
      };
      groups.set(item.categoryId, group);
    }
    group.items.push(item);
    if (item.checked) group.checkedCount++;
  }

  const sorted = [...groups.values()].sort(
    (a, b) =>
      Number(a.isSystem) - Number(b.isSystem) ||
      a.sortOrder - b.sortOrder ||
      collator.compare(a.categoryName, b.categoryName)
  );

  return sorted.map(({ isSystem: _isSystem, sortOrder: _sortOrder, ...group }) => ({
    ...group,
    items: [...group.items].sort(
      (a, b) =>
        (checkedLast ? Number(a.checked) - Number(b.checked) : 0) ||
        collator.compare(a.productName, b.productName)
    ),
  }));
}

/**
 * Indizes der Kategorie-Überschriften im flachen ScrollView-Inhalt (sticky):
 * je Gruppe eine Überschrift, gefolgt von `rowsPerGroup(group)` Zeilen.
 */
export function stickyHeaderIndices<T>(
  groups: T[],
  rowsPerGroup: (group: T) => number = (group) => (group as CategoryGroup).items.length
): number[] {
  const indices: number[] = [];
  let index = 0;
  for (const group of groups) {
    indices.push(index);
    index += rowsPerGroup(group) + 1;
  }
  return indices;
}
