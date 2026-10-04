import "@/global.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GluestackUIProvider } from "@/components/provider/gluestack-ui-provider";
import { ThemeProvider, useTheme } from "@/components/provider/theme-provider";


function AppContent() {
  const { theme } = useTheme()
  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <GluestackUIProvider mode={theme}>
        <Slot />
      </GluestackUIProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
