import type { ThemeMode } from "@/stores/themeStore";

export interface ThemePageProps {
  readonly currentMode: ThemeMode;
  readonly onSelect: (mode: ThemeMode) => void;
}

export interface ThemeSectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}
