import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";
import { create } from "zustand";

import type { ColorPalette } from "@/styles/palettes";
import { darkPalette, lightPalette, oledPalette } from "@/styles/palettes";

export type ThemeMode = "dark" | "light" | "oled" | "auto";

const STORAGE_KEY = "nstil_theme_mode";

function resolveAutoMode(): "dark" | "light" {
  const scheme = Appearance.getColorScheme();
  return scheme === "light" ? "light" : "dark";
}

function resolvePalette(mode: ThemeMode): ColorPalette {
  switch (mode) {
    case "dark":
      return darkPalette;
    case "light":
      return lightPalette;
    case "oled":
      return oledPalette;
    case "auto":
      return resolvePalette(resolveAutoMode());
  }
}

function resolveKeyboardAppearance(mode: ThemeMode): "dark" | "light" {
  if (mode === "light") return "light";
  if (mode === "auto") return resolveAutoMode() === "light" ? "light" : "dark";
  return "dark";
}

interface ThemeState {
  readonly mode: ThemeMode;
  readonly colors: ColorPalette;
  readonly isDark: boolean;
  readonly keyboardAppearance: "dark" | "light";
  readonly initialized: boolean;
  initialize: () => void;
  setMode: (mode: ThemeMode) => void;
}

function computeState(mode: ThemeMode) {
  const colors = resolvePalette(mode);
  const effectiveMode = mode === "auto" ? resolveAutoMode() : mode;
  return {
    mode,
    colors,
    isDark: effectiveMode !== "light",
    keyboardAppearance: resolveKeyboardAppearance(mode),
  };
}

export const useThemeStore = create<ThemeState>((set) => ({
  ...computeState("dark"),
  initialized: false,

  initialize: () => {
    let stored: string | null = null;
    try {
      stored = SecureStore.getItem(STORAGE_KEY);
    } catch {
      // fall through to default
    }

    const mode = isValidMode(stored) ? stored : "dark";
    set({ ...computeState(mode), initialized: true });
  },

  setMode: (mode: ThemeMode) => {
    set(computeState(mode));
    try {
      SecureStore.setItem(STORAGE_KEY, mode);
    } catch {
      // non-critical
    }
  },
}));

function isValidMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light" || value === "oled" || value === "auto";
}
