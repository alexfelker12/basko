import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { db } from "@/lib/db";
import { resolveLocale, setLocale, type LanguageSetting } from "@/lib/i18n";
import { queryKeys } from "@/lib/query-keys";
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
 * Sprache wechseln (8a): Sprache sofort umstellen und Listen- und Katalog-Abfragen aus dem Cache
 * werfen – sie enthalten übersetzte Kategorienamen (`categoryLabel`) und werden beim Neu-Einhängen
 * in der neuen Sprache gelesen. Dann die Einstellung speichern: Das Root-Layout
 * hängt daraufhin die Screens neu ein und kehrt zu `returnRoute` zurück (die Einstellungen).
 */
export function useChangeLanguage(returnRoute: string) {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateSetting();

  return (language: LanguageSetting) => {
    returnRouteAfterLanguageChange = returnRoute;
    setLocale(resolveLocale(language));
    queryClient.removeQueries({ queryKey: queryKeys.lists });
    queryClient.removeQueries({ queryKey: queryKeys.products });
    updateSetting.mutate({ key: "language", value: language });
  };
}
