/**
 * Vergleich von Namen ohne Beachtung der Groß-/Kleinschreibung (Produkte, Kategorien):
 * „Äpfel“ und „äpfel “ gelten als gleich. Volle Unicode-Faltung inkl. Umlaute –
 * der Unique-Index in SQLite (`lower()`) kennt nur ASCII und ist nur das Sicherheitsnetz.
 */
export function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("de");
}

/** `true`, wenn `name` (getrimmt, ohne Groß-/Kleinschreibung) schon unter `takenNames` vorkommt. */
export function isNameTaken(name: string, takenNames: Iterable<string>): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  for (const taken of takenNames) {
    if (normalizeName(taken) === normalized) return true;
  }
  return false;
}
