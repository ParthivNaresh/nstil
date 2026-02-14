import type { ThemeMode } from "@/stores/themeStore";

export interface ThemeModeOption {
  readonly value: ThemeMode;
  readonly labelKey: string;
  readonly previewColors: readonly [string, string, string];
}

export interface ThemePickerProps {
  readonly currentMode: ThemeMode;
  readonly onSelect: (mode: ThemeMode) => void;
}

export interface ThemeModeCardProps {
  readonly option: ThemeModeOption;
  readonly isSelected: boolean;
  readonly onSelect: (mode: ThemeMode) => void;
}
