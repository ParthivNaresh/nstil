import type { AmbientColorSet } from "@/components/ui/AmbientBackground/ambientColors";
import type { ColorPalette } from "@/styles/palettes";

import { adjustBrightness, getLuminance, hexToNormalized4, withAlpha } from "./colorUtils";

export interface CustomThemeInput {
  readonly background: string;
  readonly cardColor: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly accent: string;
  readonly gradient1: string;
  readonly gradient2: string;
  readonly gradient3: string;
}

export interface BuiltCustomTheme {
  readonly palette: ColorPalette;
  readonly ambient: AmbientColorSet;
  readonly isDark: boolean;
}

const DARK_LUMINANCE_THRESHOLD = 0.2;

const DARK_SEMANTIC = {
  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.10)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.10)",
  error: "#F87171",
  errorMuted: "rgba(248, 113, 113, 0.10)",
  onError: "#FFFFFF",
} as const;

const LIGHT_SEMANTIC = {
  success: "#059669",
  successMuted: "rgba(5, 150, 105, 0.08)",
  warning: "#D97706",
  warningMuted: "rgba(217, 119, 6, 0.08)",
  error: "#DC2626",
  errorMuted: "rgba(220, 38, 38, 0.08)",
  onError: "#FFFFFF",
} as const;

export function buildCustomPalette(input: CustomThemeInput): BuiltCustomTheme {
  const { background, cardColor, textPrimary, textSecondary, accent, gradient1, gradient2, gradient3 } = input;

  const isDark = getLuminance(background) < DARK_LUMINANCE_THRESHOLD;
  const overlayBase = isDark ? "255, 255, 255" : "0, 0, 0";
  const semantic = isDark ? DARK_SEMANTIC : LIGHT_SEMANTIC;

  const surface = cardColor;
  const surfaceElevated = adjustBrightness(cardColor, isDark ? 10 : -8);
  const accentLight = adjustBrightness(accent, isDark ? 30 : -20);

  const glassAlpha = isDark ? 0.12 : 0.60;
  const glassBorderAlpha = isDark ? 0.18 : 0.12;
  const glassHoverAlpha = isDark ? 0.22 : 0.70;
  const borderAlpha = isDark ? 0.10 : 0.08;

  const palette: ColorPalette = {
    background,
    surface,
    surfaceElevated,

    sheet: surface,
    glass: withAlpha(cardColor, glassAlpha),
    glassBorder: withAlpha(cardColor, glassBorderAlpha),
    glassHover: withAlpha(cardColor, glassHoverAlpha),

    textPrimary,
    textSecondary,
    textTertiary: withAlpha(textSecondary, 0.57),

    accent,
    accentLight,
    accentMuted: withAlpha(accent, 0.15),
    onAccent: getLuminance(accent) > 0.4 ? "#000000" : "#FFFFFF",

    ...semantic,

    border: `rgba(${overlayBase}, ${borderAlpha})`,
    borderFocused: withAlpha(accent, 0.40),
  };

  const ambient: AmbientColorSet = {
    color1: hexToNormalized4(gradient1),
    color2: hexToNormalized4(gradient2),
    color3: hexToNormalized4(gradient3),
  };

  return { palette, ambient, isDark };
}
