import { darkPalette, lightPalette, oledPalette } from "@/styles/palettes";

import type { ThemeModeOption } from "./types";

export const THEME_MODE_OPTIONS: readonly ThemeModeOption[] = [
  {
    value: "dark",
    labelKey: "settings.themeModes.dark",
    previewColors: [darkPalette.background, darkPalette.surface, darkPalette.accent],
  },
  {
    value: "light",
    labelKey: "settings.themeModes.light",
    previewColors: [lightPalette.background, lightPalette.surface, lightPalette.accent],
  },
  {
    value: "oled",
    labelKey: "settings.themeModes.oled",
    previewColors: [oledPalette.background, oledPalette.surface, oledPalette.accent],
  },
  {
    value: "auto",
    labelKey: "settings.themeModes.auto",
    previewColors: [darkPalette.background, lightPalette.background, darkPalette.accent],
  },
] as const;
