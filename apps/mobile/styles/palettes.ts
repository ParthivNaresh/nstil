export interface ColorPalette {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;

  readonly glass: string;
  readonly glassBorder: string;
  readonly glassHover: string;

  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;

  readonly accent: string;
  readonly accentLight: string;
  readonly accentMuted: string;

  readonly success: string;
  readonly successMuted: string;
  readonly warning: string;
  readonly warningMuted: string;
  readonly error: string;
  readonly errorMuted: string;

  readonly border: string;
  readonly borderFocused: string;
}

export const darkPalette: ColorPalette = {
  background: "#0A0A0F",
  surface: "#12121A",
  surfaceElevated: "#1A1A24",

  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassHover: "rgba(255, 255, 255, 0.10)",

  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.70)",
  textTertiary: "rgba(255, 255, 255, 0.40)",

  accent: "#7C5CFC",
  accentLight: "#9B82FC",
  accentMuted: "rgba(124, 92, 252, 0.15)",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",

  border: "rgba(255, 255, 255, 0.06)",
  borderFocused: "rgba(124, 92, 252, 0.40)",
};

export const lightPalette: ColorPalette = {
  background: "#F9E4D4",
  surface: "#FFF0E6",
  surfaceElevated: "#F0D8C8",

  glass: "rgba(255, 240, 230, 0.70)",
  glassBorder: "rgba(0, 0, 0, 0.06)",
  glassHover: "rgba(255, 240, 230, 0.85)",

  textPrimary: "#1A1A2E",
  textSecondary: "rgba(26, 26, 46, 0.65)",
  textTertiary: "rgba(26, 26, 46, 0.40)",

  accent: "#6B4CE6",
  accentLight: "#8B6FF0",
  accentMuted: "rgba(107, 76, 230, 0.10)",

  success: "#059669",
  successMuted: "rgba(5, 150, 105, 0.08)",
  warning: "#D97706",
  warningMuted: "rgba(217, 119, 6, 0.08)",
  error: "#DC2626",
  errorMuted: "rgba(220, 38, 38, 0.08)",

  border: "rgba(0, 0, 0, 0.08)",
  borderFocused: "rgba(107, 76, 230, 0.40)",
};

export const oledPalette: ColorPalette = {
  background: "#000000",
  surface: "#0A0A0A",
  surfaceElevated: "#141414",

  glass: "rgba(255, 255, 255, 0.03)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
  glassHover: "rgba(255, 255, 255, 0.06)",

  textPrimary: "#F0F0F0",
  textSecondary: "rgba(240, 240, 240, 0.70)",
  textTertiary: "rgba(240, 240, 240, 0.40)",

  accent: "#8B6FF0",
  accentLight: "#A78BFA",
  accentMuted: "rgba(139, 111, 240, 0.12)",

  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.08)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.08)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.08)",

  border: "rgba(255, 255, 255, 0.08)",
  borderFocused: "rgba(139, 111, 240, 0.40)",
};
