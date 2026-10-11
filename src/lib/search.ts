/**
 * Produktsuche (Spezifikation 3c): Teilwort, ohne Groß-/Kleinschreibung, umlauttolerant
 * („apfel“ findet „Äpfel“). Der Treffer wird im Originalnamen markiert.
 */

/** Faltet ein einzelnes Zeichen: Kleinbuchstaben, ohne Akzente/Umlaute, ß → ss. */
function foldChar(char: string): string {
  const lower = char.toLocaleLowerCase("de");
  if (lower === "ß") return "ss";
  return lower.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Gefalteter Text und für jede Position im gefalteten Text der Index im Original. */
function foldWithMap(text: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  Array.from(text).forEach((char, index) => {
    for (const part of foldChar(char)) {
      folded += part;
      map.push(index);
    }
  });
  return { folded, map };
}

export function foldForSearch(text: string): string {
  return foldWithMap(text).folded;
}

export type HighlightPart = { text: string; match: boolean };

/**
 * Sucht `query` in `text`. Liefert `null` ohne Treffer, sonst die Teile des Originaltexts
 * mit markiertem erstem Treffer.
 */
export function matchText(text: string, query: string): HighlightPart[] | null {
  const needle = foldForSearch(query.trim());
  if (!needle) return [{ text, match: false }];

  const { folded, map } = foldWithMap(text);
  const start = folded.indexOf(needle);
  if (start < 0) return null;

  const chars = Array.from(text);
  const from = map[start];
  const to = map[start + needle.length - 1] + 1;
  return [
    { text: chars.slice(0, from).join(""), match: false },
    { text: chars.slice(from, to).join(""), match: true },
    { text: chars.slice(to).join(""), match: false },
  ].filter((part) => part.text.length > 0);
}
