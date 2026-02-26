export interface JournalColorPreset {
  readonly hex: string;
  readonly label: string;
}

export const JOURNAL_COLOR_PRESETS: readonly JournalColorPreset[] = [
  { hex: "#6A89CC", label: "Blue" },
  { hex: "#38ADA9", label: "Teal" },
  { hex: "#34D399", label: "Green" },
  { hex: "#F6B93B", label: "Gold" },
  { hex: "#E55039", label: "Red" },
  { hex: "#9B59B6", label: "Purple" },
  { hex: "#EB7A68", label: "Coral" },
  { hex: "#8DA4DB", label: "Lavender" },
  { hex: "#5EC4C0", label: "Mint" },
  { hex: "#F8C96B", label: "Amber" },
] as const;

export const DEFAULT_JOURNAL_COLOR = JOURNAL_COLOR_PRESETS[0].hex;
