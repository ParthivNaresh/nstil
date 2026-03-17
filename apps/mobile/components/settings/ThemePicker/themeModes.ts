import { darkPalette, lightPalette, oledPalette } from "@/styles/palettes";

import type { ThemeModeOption } from "./types";

export const THEME_MODE_OPTIONS: readonly ThemeModeOption[] = [
  {
    value: "dark",
    labelKey: "settings.themeModes.dark",
    previewColors: [darkPalette.background, darkPalette.surface, darkPalette.textPrimary, darkPalette.textSecondary, darkPalette.accent],
  },
  {
    value: "light",
    labelKey: "settings.themeModes.light",
    previewColors: [lightPalette.background, lightPalette.surface, lightPalette.textPrimary, lightPalette.textSecondary, lightPalette.accent],
  },
  {
    value: "oled",
    labelKey: "settings.themeModes.oled",
    previewColors: [oledPalette.background, oledPalette.surface, oledPalette.textPrimary, oledPalette.textSecondary, oledPalette.accent],
  },
  {
    value: "auto",
    labelKey: "settings.themeModes.auto",
    previewColors: [darkPalette.background, lightPalette.background, darkPalette.textPrimary, lightPalette.textPrimary, darkPalette.accent],
  },
] as const;
