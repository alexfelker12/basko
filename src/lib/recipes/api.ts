import { z } from "zod";

/**
 * API Ninjas Recipe API v3 (Spezifikation → 7 · Rezepte). Nur der Free Tier: Suche nach Titel,
 * max. 5 Treffer, kein Blättern, keine Zutatensuche. Es gibt keinen Detail-Endpunkt – die Details
 * (7d) kommen aus der Trefferliste. Rezeptinhalte bleiben Englisch.
 */
const API_URL = "https://api.api-ninjas.com/v3/recipe";
/** Free Tier: höchstens 5 Treffer pro Anfrage. */
export const RECIPE_RESULT_LIMIT = 5;
/** Ohne Antwort gilt die Verbindung als weg („Keine Verbindung“). */
const REQUEST_TIMEOUT_MS = 15_000;

/** Schlüssel aus `.env` (`EXPO_PUBLIC_API_NINJAS_KEY`) – in der App auslesbar, bewusst akzeptiert. */
const API_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY;

/** Menge als Zahl; vereinzelt kommen Brüche als Text („1/2“, „1 1/2“). */
const quantitySchema = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => (typeof value === "string" ? parseFraction(value) : (value ?? null)));

const ingredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: quantitySchema,
  unit: z
    .string()
    .nullish()
    .transform((value) => value?.trim() || null),
});

const optionalNumber = z.number().nullish().catch(null);

const recipeSchema = z.object({
  title: z.string().trim().min(1),
  servings: z.string().nullish().catch(null),
  ingredients: z.array(ingredientSchema.nullable().catch(null)).catch([]),
  // v3 liefert Schritte als Liste; zur Sicherheit auch ein einzelner Text
  instructions: z
    .union([z.array(z.string()), z.string()])
    .nullish()
    .catch(null)
    .transform((value) => (typeof value === "string" ? [value] : (value ?? []))),
  nutrition: z
    .object({
      calories: optionalNumber,
      protein: optionalNumber,
      total_carbohydrate: optionalNumber,
      total_fat: optionalNumber,
    })
    .nullish()
    .catch(null),
});

export type RecipeIngredient = z.output<typeof ingredientSchema>;

export type Recipe = {
  title: string;
  /** Wie geliefert, z. B. „6 servings“. */
  servings: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  /** Nährwerte pro Rezept (laut API: Filter „per recipe“); fehlende Werte `null`. */
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
};

/**
 * Fehlerarten der Rezeptsuche (7b): `offline` → „Keine Verbindung“ mit „Erneut versuchen“,
 * `unavailable` → „Rezeptsuche gerade nicht verfügbar“ (Kontingent aufgebraucht, Schlüssel fehlt
 * oder ungültig, Serverfehler, unlesbare Antwort).
 */
export class RecipeApiError extends Error {
  constructor(
    readonly reason: "offline" | "unavailable",
    message: string
  ) {
    super(message);
    this.name = "RecipeApiError";
  }
}

/** Suchbegriff für Anfrage und Cache-Schlüssel. */
export function normalizeRecipeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

/**
 * Suche nach Titel (`title`, `limit=5`). Liefert die Treffer in API-Reihenfolge; Einträge, die
 * nicht ins Schema passen, werden übersprungen.
 */
export async function searchRecipes(query: string, signal?: AbortSignal): Promise<Recipe[]> {
  const title = normalizeRecipeQuery(query);
  if (!title) return [];
  if (!API_KEY) {
    if (__DEV__) console.warn("[recipes] EXPO_PUBLIC_API_NINJAS_KEY fehlt in .env");
    throw new RecipeApiError("unavailable", "missing api key");
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    const params = new URLSearchParams({ title, limit: String(RECIPE_RESULT_LIMIT) });
    response = await fetch(`${API_URL}?${params}`, {
      headers: { "X-Api-Key": API_KEY, Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    // Abbruch durch TanStack Query (Screen verlassen) unverändert weiterreichen
    if (signal?.aborted) throw error;
    throw new RecipeApiError("offline", String(error));
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }

  if (!response.ok) {
    if (__DEV__)
      console.warn("[recipes] HTTP", response.status, await response.text().catch(() => ""));
    throw new RecipeApiError("unavailable", `http ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new RecipeApiError("unavailable", `invalid json: ${String(error)}`);
  }
  if (!Array.isArray(body)) throw new RecipeApiError("unavailable", "unexpected response");

  return body.slice(0, RECIPE_RESULT_LIMIT).flatMap((entry) => {
    const parsed = recipeSchema.safeParse(entry);
    if (!parsed.success) return [];
    const { title, servings, ingredients, instructions, nutrition } = parsed.data;
    return [
      {
        title,
        servings: servings?.trim() || null,
        ingredients: ingredients.filter((item): item is RecipeIngredient => item !== null),
        instructions: instructions.map((step) => step.trim()).filter(Boolean),
        nutrition: {
          calories: nutrition?.calories ?? null,
          protein: nutrition?.protein ?? null,
          carbs: nutrition?.total_carbohydrate ?? null,
          fat: nutrition?.total_fat ?? null,
        },
      },
    ];
  });
}

/** „1/2“ → 0,5, „1 1/2“ → 1,5, „1.5“ → 1,5; sonst `null`. */
function parseFraction(input: string): number | null {
  const text = input.trim();
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const value = Number(text.replace(",", "."));
  return text !== "" && Number.isFinite(value) ? value : null;
}
