import { randomUUID } from "expo-crypto";

/**
 * Neue ID (UUID als Text). Bewusst nicht als `$defaultFn` im Schema,
 * weil drizzle-kit das Schema in Node lädt, wo expo-crypto nicht verfügbar ist.
 */
export function newId(): string {
  return randomUUID();
}
