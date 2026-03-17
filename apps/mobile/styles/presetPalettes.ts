import type { AmbientColorSet } from "@/components/ui/AmbientBackground/ambientColors";

import type { ColorPalette } from "./palettes";

export type PresetId = "sunset" | "forest" | "ocean" | "rose";

export interface PresetTheme {
  readonly id: PresetId;
  readonly labelKey: string;
  readonly isDark: boolean;
  readonly palette: ColorPalette;
  readonly ambient: AmbientColorSet;
}

const sunsetPalette: ColorPalette = {
  background: "#1A0E0A",
  surface: "#241410",
  surfaceElevated: "#2E1C16",

  sheet: "#2E1C16",
  glass: "rgba(255, 180, 120, 0.05)",
  glassBorder: "rgba(255, 180, 120, 0.08)",
  glassHover: "rgba(255, 180, 120, 0.10)",

  textPrimary: "#FFF5ED",
  textSecondary: "rgba(255, 245, 237, 0.70)",
  textTertiary: "rgba(255, 245, 237, 0.40)",

  accent: "#F97316",
  accentLight: "#FB923C",
  accentMuted: "rgba(249, 115, 22, 0.15)",
  onAccent: "#FFFFFF",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",
  onError: "#FFFFFF",

  border: "rgba(255, 180, 120, 0.06)",
  borderFocused: "rgba(249, 115, 22, 0.40)",
};

const sunsetAmbient: AmbientColorSet = {
  color1: [0.10, 0.055, 0.039, 1.0],
  color2: [0.45, 0.12, 0.05, 1.0],
  color3: [0.30, 0.08, 0.20, 1.0],
};

const forestPalette: ColorPalette = {
  background: "#0A1210",
  surface: "#101C18",
  surfaceElevated: "#162420",

  sheet: "#162420",
  glass: "rgba(160, 220, 180, 0.05)",
  glassBorder: "rgba(160, 220, 180, 0.08)",
  glassHover: "rgba(160, 220, 180, 0.10)",

  textPrimary: "#EDF5F0",
  textSecondary: "rgba(237, 245, 240, 0.70)",
  textTertiary: "rgba(237, 245, 240, 0.40)",

  accent: "#4ADE80",
  accentLight: "#86EFAC",
  accentMuted: "rgba(74, 222, 128, 0.15)",
  onAccent: "#0A1210",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",
  onError: "#FFFFFF",

  border: "rgba(160, 220, 180, 0.06)",
  borderFocused: "rgba(74, 222, 128, 0.40)",
};

const forestAmbient: AmbientColorSet = {
  color1: [0.039, 0.071, 0.063, 1.0],
  color2: [0.06, 0.22, 0.12, 1.0],
  color3: [0.04, 0.14, 0.18, 1.0],
};

const oceanPalette: ColorPalette = {
  background: "#080E14",
  surface: "#0E1620",
  surfaceElevated: "#141E2A",

  sheet: "#141E2A",
  glass: "rgba(120, 180, 255, 0.05)",
  glassBorder: "rgba(120, 180, 255, 0.08)",
  glassHover: "rgba(120, 180, 255, 0.10)",

  textPrimary: "#EDF2FF",
  textSecondary: "rgba(237, 242, 255, 0.70)",
  textTertiary: "rgba(237, 242, 255, 0.40)",

  accent: "#38BDF8",
  accentLight: "#7DD3FC",
  accentMuted: "rgba(56, 189, 248, 0.15)",
  onAccent: "#080E14",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",
  onError: "#FFFFFF",

  border: "rgba(120, 180, 255, 0.06)",
  borderFocused: "rgba(56, 189, 248, 0.40)",
};

const oceanAmbient: AmbientColorSet = {
  color1: [0.031, 0.055, 0.078, 1.0],
  color2: [0.05, 0.12, 0.30, 1.0],
  color3: [0.04, 0.20, 0.28, 1.0],
};

const rosePalette: ColorPalette = {
  background: "#140A10",
  surface: "#1E1018",
  surfaceElevated: "#281820",

  sheet: "#281820",
  glass: "rgba(255, 160, 200, 0.05)",
  glassBorder: "rgba(255, 160, 200, 0.08)",
  glassHover: "rgba(255, 160, 200, 0.10)",

  textPrimary: "#FFF0F5",
  textSecondary: "rgba(255, 240, 245, 0.70)",
  textTertiary: "rgba(255, 240, 245, 0.40)",

  accent: "#F472B6",
  accentLight: "#F9A8D4",
  accentMuted: "rgba(244, 114, 182, 0.15)",
  onAccent: "#FFFFFF",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",
  onError: "#FFFFFF",

  border: "rgba(255, 160, 200, 0.06)",
  borderFocused: "rgba(244, 114, 182, 0.40)",
};

const roseAmbient: AmbientColorSet = {
  color1: [0.078, 0.039, 0.063, 1.0],
  color2: [0.30, 0.08, 0.20, 1.0],
  color3: [0.18, 0.05, 0.14, 1.0],
};

export const PRESET_THEMES: readonly PresetTheme[] = [
  { id: "sunset", labelKey: "settings.themePresets.sunset", isDark: true, palette: sunsetPalette, ambient: sunsetAmbient },
  { id: "forest", labelKey: "settings.themePresets.forest", isDark: true, palette: forestPalette, ambient: forestAmbient },
  { id: "ocean", labelKey: "settings.themePresets.ocean", isDark: true, palette: oceanPalette, ambient: oceanAmbient },
  { id: "rose", labelKey: "settings.themePresets.rose", isDark: true, palette: rosePalette, ambient: roseAmbient },
] as const;

export function getPresetTheme(id: PresetId): PresetTheme | undefined {
  return PRESET_THEMES.find((preset) => preset.id === id);
}
