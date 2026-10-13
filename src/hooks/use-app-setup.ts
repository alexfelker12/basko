import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { settingsQueryKey } from "@/hooks/use-settings";
import { db } from "@/lib/db";
import migrations from "@/lib/db/migrations/migrations";
import { purgeSoftDeleted } from "@/lib/db/purge";
import { seedDatabase } from "@/lib/db/seed";
import { resolveLocale, setLocale } from "@/lib/i18n";
import { readSettings } from "@/lib/settings";
import { applyColorScheme } from "@/lib/theme";

type SetupState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: Error };

/**
 * Start der App, solange der Splash steht:
 * Migrationen → Einstellungen synchron lesen, Sprache setzen → Seed („Sonstiges“ +
 * Standard-Kategorien) → endgültig löschen, was noch auf Rückgängig wartete → Thema setzen.
 */
export function useAppSetup(): SetupState {
  const queryClient = useQueryClient();
  const migration = useMigrations(db, migrations);

  const setup = useQuery({
    queryKey: ["app-setup"],
    enabled: migration.success,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: () => {
      // Sprache zuerst: Der Seed legt die Standard-Kategorien mit Namen der aktiven Sprache an
      const settings = readSettings(db);
      setLocale(resolveLocale(settings.language));
      seedDatabase(db);
      purgeSoftDeleted(db);
      queryClient.setQueryData(settingsQueryKey, settings);
      applyColorScheme(settings.theme);
      return true;
    },
  });

  if (migration.error) return { status: "error", error: migration.error };
  if (setup.error) return { status: "error", error: setup.error };
  if (setup.isSuccess) return { status: "ready" };
  return { status: "loading" };
}
