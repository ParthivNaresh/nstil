import { useEffect } from "react";
import { Appearance } from "react-native";

import type { CustomThemeInput } from "@/lib/themeBuilder";
import type { ColorPalette } from "@/styles/palettes";
import { useThemeStore } from "@/stores/themeStore";
import type { SavedCustomTheme, ThemeMode } from "@/stores/themeStore";

interface ThemeResult {
  readonly colors: ColorPalette;
  readonly mode: ThemeMode;
  readonly isDark: boolean;
  readonly keyboardAppearance: "dark" | "light";
  readonly customThemes: readonly SavedCustomTheme[];
  readonly activeCustomId: string | null;
  readonly setMode: (mode: ThemeMode) => void;
  readonly saveCustomTheme: (name: string, input: CustomThemeInput) => SavedCustomTheme;
  readonly updateCustomTheme: (id: string, name: string, input: CustomThemeInput) => void;
  readonly deleteCustomTheme: (id: string) => void;
  readonly activateCustomTheme: (id: string) => void;
}

export function useTheme(): ThemeResult {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const isDark = useThemeStore((s) => s.isDark);
  const keyboardAppearance = useThemeStore((s) => s.keyboardAppearance);
  const customThemes = useThemeStore((s) => s.customThemes);
  const activeCustomId = useThemeStore((s) => s.activeCustomId);
  const setMode = useThemeStore((s) => s.setMode);
  const saveCustomTheme = useThemeStore((s) => s.saveCustomTheme);
  const updateCustomTheme = useThemeStore((s) => s.updateCustomTheme);
  const deleteCustomTheme = useThemeStore((s) => s.deleteCustomTheme);
  const activateCustomTheme = useThemeStore((s) => s.activateCustomTheme);

  useEffect(() => {
    if (mode !== "auto") return;

    const subscription = Appearance.addChangeListener(() => {
      useThemeStore.getState().setMode("auto");
    });

    return () => subscription.remove();
  }, [mode]);

  return {
    colors,
    mode,
    isDark,
    keyboardAppearance,
    customThemes,
    activeCustomId,
    setMode,
    saveCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    activateCustomTheme,
  };
}
