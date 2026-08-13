import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";

import { storage } from "@/src/utils/storage";
import { ThemeMode } from "@/src/types";
import { fonts, fontSize, palette, radius, spacing, ThemeColors } from "./tokens";

const MODE_KEY = "resonance.theme.mode";

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  fontSize: typeof fontSize;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() ?? "dark",
  );

  useEffect(() => {
    storage.getItem<ThemeMode>(MODE_KEY, "dark").then((m) => {
      if (m) setModeState(m);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "dark");
    });
    return () => sub.remove();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    storage.setItem(MODE_KEY, m);
  };

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? palette.dark : palette.light,
      isDark,
      mode,
      setMode,
      spacing,
      radius,
      fonts,
      fontSize,
    }),
    [isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
