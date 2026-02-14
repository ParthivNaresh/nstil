import type { ThemeMode } from "@/stores/themeStore";

export interface AmbientColorSet {
  readonly color1: readonly [number, number, number, number];
  readonly color2: readonly [number, number, number, number];
  readonly color3: readonly [number, number, number, number];
}

const darkColors: AmbientColorSet = {
  color1: [0.039, 0.039, 0.059, 1.0],
  color2: [0.20, 0.08, 0.40, 1.0],
  color3: [0.05, 0.18, 0.35, 1.0],
};

const lightColors: AmbientColorSet = {
  color1: [0.976, 0.894, 0.831, 1.0],
  color2: [0.78, 0.65, 0.88, 1.0],
  color3: [0.70, 0.78, 0.92, 1.0],
};

const oledColors: AmbientColorSet = {
  color1: [0.0, 0.0, 0.0, 1.0],
  color2: [0.14, 0.06, 0.28, 1.0],
  color3: [0.04, 0.12, 0.24, 1.0],
};

const COLOR_MAP: Record<Exclude<ThemeMode, "auto">, AmbientColorSet> = {
  dark: darkColors,
  light: lightColors,
  oled: oledColors,
};

export function getAmbientColors(mode: ThemeMode, resolvedIsDark: boolean): AmbientColorSet {
  if (mode === "auto") {
    return resolvedIsDark ? darkColors : lightColors;
  }
  return COLOR_MAP[mode];
}
