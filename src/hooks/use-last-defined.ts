import { useState } from "react";

/**
 * Letzter Wert ungleich `null` – damit ein Sheet beim Zuschieben seinen Inhalt behält,
 * obwohl der Auslöser (z. B. die gewählte Liste) schon auf `null` steht.
 */
export function useLastDefined<T>(value: T | null): T | null {
  const [last, setLast] = useState<T | null>(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}
