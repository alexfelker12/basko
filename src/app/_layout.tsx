import "@/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "expo-navigation-bar";
import { router, Stack, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider, useResizeMode } from "react-native-keyboard-controller";

import { RestoreHost } from "@/components/backup/restore-host";
import { ErrorScreen } from "@/components/error-screen";
import { AppToastProvider } from "@/components/toast-host";
import { TransferHost } from "@/components/transfer/transfer-host";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useAppSetup } from "@/hooks/use-app-setup";
import { takeReturnRouteAfterLanguageChange, useSettings } from "@/hooks/use-settings";
import { resolveLocale, setLocale } from "@/lib/i18n";
import { queryClient } from "@/lib/query-client";

// Der Splash bleibt stehen, bis Migrationen, Seed und Einstellungen (inkl. Thema) bereit sind.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 200 });

function hideSplash() {
  SplashScreen.hide();
}

function ThemedApp() {
  const { theme, language } = useSettings();
  // Sprache vor dem Rendern der Screens setzen (ohne Änderung wirkungslos). Wechselt sie, hängt
  // `key` alle Screens neu ein – jeder Text wird neu übersetzt (der React Compiler memoisiert
  // sonst die alten Texte). Danach zurück auf den Screen des Wechsels; stand er schon oben, bleibt
  // alles, wie es ist, sonst wird er über der Startseite geöffnet.
  const locale = resolveLocale(language);
  setLocale(locale);
  useEffect(() => {
    const route = takeReturnRouteAfterLanguageChange();
    if (route) requestAnimationFrame(() => router.navigate(route as Href));
  }, [locale]);

  return (
    // Toasts liegen außerhalb, damit sie über allen Overlays (Sheets, Dialoge) erscheinen
    <AppToastProvider>
      <GluestackUIProvider mode={theme}>
        {/* Erst nach dem ersten Layout im richtigen Thema verschwindet der Splash */}
        <View className="flex-1 bg-bg" onLayout={hideSplash}>
          {/* Rand bis Rand: Status- und Navigationsleiste folgen dem Thema */}
          <StatusBar style="auto" />
          <NavigationBar style="auto" />
          {/* Sichtbarkeit im Netzwerk und Transfer-Hinweise (Phase 4) */}
          <TransferHost />
          {/* „Daten ersetzen?“ – auch für von außen geöffnete Sicherungen (Phase 6) */}
          <RestoreHost />
          <Stack
            key={locale}
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

  // Android-Eingabemodus einmalig fest auf „resize“: Mit dem KeyboardProvider bleibt das Fenster
  // dabei unverändert (Rand bis Rand) – Sheets, Dialoge, Toasts und Suchleisten heben sich selbst
  // über die Tastatur. Andere Komponenten lesen die Tastatur nur über `useKeyboardHeight()`.
  useResizeMode();

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
