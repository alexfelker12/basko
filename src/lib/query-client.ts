import { QueryClient, type QueryKey } from "@tanstack/react-query";

export const queryClient = new QueryClient();

/**
 * Optionen für Abfragen der lokalen Datenbank. Die laufen synchron, daher liefert `initialData`
 * die Daten schon beim ersten Rendern: keine Lade-Zustände, kein Aufblitzen leerer Screens oder
 * fehlender Texte (z. B. „Wird in 3 Listen verwendet“ im Löschen-Dialog 4f). Ist ein Schlüssel
 * schon im Cache, gilt der Cache; Änderungen kommen wie bisher über `invalidateQueries`.
 */
export function localQuery<TData, TKey extends QueryKey>(queryKey: TKey, read: () => TData) {
  return { queryKey, queryFn: read, initialData: read };
}
