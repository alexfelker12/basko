/**
 * Namensregel „(n)“ (Spezifikation → Globale Muster): Kollidiert ein Listenname, bekommt er
 * die nächste freie Zahl – „Wocheneinkauf (2)“, „Kopie von Wocheneinkauf (3)“.
 * Verglichen wird ohne Beachtung der Groß-/Kleinschreibung.
 */
export function resolveListName(desired: string, takenNames: Iterable<string>): string {
  const name = desired.trim();
  const taken = new Set(Array.from(takenNames, (taken) => taken.trim().toLocaleLowerCase("de")));
  if (!taken.has(name.toLocaleLowerCase("de"))) return name;

  // „Wocheneinkauf (2)“ zählt weiter als „Wocheneinkauf (3)“ statt „Wocheneinkauf (2) (2)“
  const base = name.match(/^(.*\S)\s\((\d+)\)$/)?.[1] ?? name;
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})`;
    if (!taken.has(candidate.toLocaleLowerCase("de"))) return candidate;
  }
}
