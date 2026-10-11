import "@/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorScreen } from "@/components/error-screen";
import { AppToastProvider } from "@/components/toast-host";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useAppSetup } from "@/hooks/use-app-setup";
import { useSettings } from "@/hooks/use-settings";
import { queryClient } from "@/lib/query-client";

// Der Splash bleibt stehen, bis Migrationen, Seed und Einstellungen (inkl. Thema) bereit sind.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 200 });

function hideSplash() {
  SplashScreen.hide();
}

function ThemedApp() {
  const { theme } = useSettings();

  return (
    // Toasts liegen außerhalb, damit sie über allen Overlays (Sheets, Dialoge) erscheinen
    <AppToastProvider>
      <GluestackUIProvider mode={theme}>
        {/* Erst nach dem ersten Layout im richtigen Thema verschwindet der Splash */}
        <View className="flex-1 bg-bg" onLayout={hideSplash}>
          {/* Rand bis Rand: Status- und Navigationsleiste folgen dem Thema */}
          <StatusBar style="auto" />
          <NavigationBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </GluestackUIProvider>
    </AppToastProvider>
  );
}

function AppShell() {
  const setup = useAppSetup();

  if (setup.status === "loading") return null;

  if (setup.status === "error") {
    return (
      <View className="flex-1" onLayout={hideSplash}>
        <ErrorScreen message={setup.error.message} />
      </View>
    );
  }

  return <ThemedApp />;
}

export default function RootLayout() {
  // useDrizzleStudio(db.$client)

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppShell />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
