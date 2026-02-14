import { useEffect } from "react";
import { Appearance } from "react-native";

import type { ColorPalette } from "@/styles/palettes";
import { useThemeStore } from "@/stores/themeStore";
import type { ThemeMode } from "@/stores/themeStore";

interface ThemeResult {
  readonly colors: ColorPalette;
  readonly mode: ThemeMode;
  readonly isDark: boolean;
  readonly keyboardAppearance: "dark" | "light";
  readonly setMode: (mode: ThemeMode) => void;
}

export function useTheme(): ThemeResult {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const isDark = useThemeStore((s) => s.isDark);
  const keyboardAppearance = useThemeStore((s) => s.keyboardAppearance);
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    if (mode !== "auto") return;

    const subscription = Appearance.addChangeListener(() => {
      useThemeStore.getState().setMode("auto");
    });

    return () => subscription.remove();
  }, [mode]);

  return { colors, mode, isDark, keyboardAppearance, setMode };
}
