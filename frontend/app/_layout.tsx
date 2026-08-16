import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SheetProvider } from "@/src/components/SheetProvider";
import { getDb } from "@/src/db/database";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/theme/ThemeProvider";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="queue" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="edit/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="playlist/edit/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Prewarm icon fonts (non-blocking) — our UI uses SVG icons, so we never
  // gate rendering on this.
  useIconFonts();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces: require("../assets/fonts/Fraunces.ttf"),
    Manrope: require("../assets/fonts/Manrope.ttf"),
  });

  // Fallback so the app never gets stuck on the splash if font loading stalls
  // on a real device.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    getDb();
  }, []);

  const ready = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <SheetProvider>
              <Navigator />
            </SheetProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
