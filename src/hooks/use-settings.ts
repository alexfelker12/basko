import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { db } from "@/lib/db";
import { localizeDefaultCategories } from "@/lib/db/seed";
import { resolveLocale, type LanguageSetting } from "@/lib/i18n";
import {
  readSettings,
  writeSetting,
  type SettingUpdate,
  type Settings,
} from "@/lib/settings";

export const settingsQueryKey = ["settings"] as const;

/**
 * Alle Einstellungen. Der Cache wird beim Start synchron befüllt (siehe `useAppSetup`),
 * daher suspendiert der Hook praktisch nie.
 */
export function useSettings() {
  return useSuspenseQuery({
    queryKey: settingsQueryKey,
    queryFn: () => readSettings(db),
    staleTime: Infinity,
  }).data;
}

/** Ändert eine Einstellung; der Cache wird sofort aktualisiert („wirkt sofort“). */
export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: SettingUpdate) => writeSetting(db, update),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKey });
      const previous = queryClient.getQueryData<Settings>(settingsQueryKey);
      if (previous) {
        queryClient.setQueryData<Settings>(settingsQueryKey, { ...previous, [key]: value });
      }
      return { previous };
    },
    onError: (_error, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsQueryKey, context.previous);
      }
    },
  });
}

/** Route, auf der der Sprachwechsel ausgelöst wurde – das Root-Layout kehrt danach dorthin zurück. */
let returnRouteAfterLanguageChange: string | null = null;

/** Einmal abholen (Root-Layout, nach dem Neu-Einhängen der Screens). */
export function takeReturnRouteAfterLanguageChange(): string | null {
  const route = returnRouteAfterLanguageChange;
  returnRouteAfterLanguageChange = null;
  return route;
}

/**
 * Sprache wechseln (8a): Standard-Kategorien und „Sonstiges“ in die neue Sprache übernehmen, alle
 * Abfragen neu laden und die Einstellung speichern – das Root-Layout stellt daraufhin die Sprache
 * um, hängt die Screens neu ein und kehrt zu `returnRoute` zurück (die Einstellungen).
 */
export function useChangeLanguage(returnRoute: string) {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateSetting();

  return (language: LanguageSetting) => {
    returnRouteAfterLanguageChange = returnRoute;
    if (localizeDefaultCategories(db, resolveLocale(language))) {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== settingsQueryKey[0],
      });
    }
    updateSetting.mutate({ key: "language", value: language });
  };
}
