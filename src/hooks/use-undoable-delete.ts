import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAppToast } from "@/hooks/use-app-toast";
import { t } from "@/lib/i18n";
import { queryKeys } from "@/lib/query-keys";

/** Toasts mit Rückgängig bleiben 5 s stehen; danach wird endgültig gelöscht. */
const UNDO_DURATION = 5000;

/** Ausstehende endgültige Löschungen – modulweit, damit ein Screenwechsel sie nicht abbricht. */
const pendingPurges = new Map<string, ReturnType<typeof setTimeout>>();

type UndoableDelete = {
  /** Eindeutiger Schlüssel, z. B. `list:<id>`. */
  key: string;
  /** Text im Toast, z. B. „Wocheneinkauf gelöscht“. */
  title: string;
  softDelete: () => void;
  restore: () => void;
  purge: () => void;
};

/**
 * Löschen mit Rückgängig (Spezifikation → Globale Muster): `deletedAt` sofort setzen,
 * Toast mit „Rückgängig“ für 5 s, danach endgültig löschen. Beim App-Start räumt `purgeSoftDeleted` auf.
 */
export function useUndoableDelete() {
  const queryClient = useQueryClient();
  const showToast = useAppToast();

  return useCallback(
    ({ key, title, softDelete, restore, purge }: UndoableDelete) => {
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists });
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
      };

      softDelete();
      refresh();

      clearTimeout(pendingPurges.get(key));
      pendingPurges.set(
        key,
        setTimeout(() => {
          pendingPurges.delete(key);
          purge();
          refresh();
        }, UNDO_DURATION)
      );

      showToast({
        title,
        duration: UNDO_DURATION,
        action: {
          label: t("common.undo"),
          onPress: () => {
            clearTimeout(pendingPurges.get(key));
            pendingPurges.delete(key);
            restore();
            refresh();
          },
        },
      });
    },
    [queryClient, showToast]
  );
}
