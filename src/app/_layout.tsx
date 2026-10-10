import "@/global.css";


import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// import { db } from "@/lib/db";
// import { cleanupOrphanedImagesIfNeeded } from "@/lib/utils";
// import migrations from '@/server/db/migrations/migrations';
import { QueryClientProvider } from '@tanstack/react-query';
// import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
// import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { SQLiteProvider } from 'expo-sqlite';

import { ThemeProvider, useTheme } from "@/components/provider/theme-provider";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { DATABASE_NAME } from "@/lib/constants";
import { queryClient } from "@/lib/query-client";


function MigrationsGuard({ children }: { children: React.ReactNode }) {
  //   const { success, error } = useMigrations(db, migrations)

  //   useEffect(() => {
  //     if (success) {
  //       const timeout = setTimeout(cleanupOrphanedImagesIfNeeded, 2000)
  //       return () => clearTimeout(timeout)
  //     }
  //   }, [success]);

  //   if (!success && !error) return <LoadingScreen />
  //   if (error) return <ErrorScreen message={error.message} />

  return <>{children}</>
}

function AppContent() {
  const { theme } = useTheme()
  return (
    <MigrationsGuard>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <GluestackUIProvider mode={theme}>
        <Slot />
      </GluestackUIProvider>
    </MigrationsGuard>
  );
}

export default function RootLayout() {
  // useDrizzleStudio(db.$client)

  return (
    <QueryClientProvider client={queryClient}>
      <SQLiteProvider databaseName={DATABASE_NAME}>

        <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
          <KeyboardProvider>
            <ThemeProvider>

              <AppContent />

            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>

      </SQLiteProvider>
    </QueryClientProvider>
  );
}
