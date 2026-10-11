import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { db } from "@/lib/db";
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
