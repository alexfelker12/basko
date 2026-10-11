import { useToastApi, type ShowToastOptions } from "@/components/toast-host";

export type { ShowToastOptions };

/**
 * Toast anzeigen (Spezifikation → Globale Muster → Toast), z. B.
 * `showToast({ title, action: { label: t("common.undo"), onPress } })`. Standarddauer 2,5 s.
 */
export function useAppToast() {
  return useToastApi().show;
}
