import type { MoodCategory } from "@/types";

export interface MoodGradient {
  readonly from: string;
  readonly to: string;
}

const MOOD_GRADIENTS: Record<MoodCategory, MoodGradient> = {
  happy: { from: "#F6B93B", to: "#F8C96B" },
  calm: { from: "#38ADA9", to: "#5EC4C0" },
  sad: { from: "#6A89CC", to: "#8DA4DB" },
  anxious: { from: "#9B59B6", to: "#B07CC6" },
  angry: { from: "#E55039", to: "#EB7A68" },
};

const DEFAULT_GRADIENT: MoodGradient = { from: "#6A89CC", to: "#8DA4DB" };

export function getMoodGradient(category: MoodCategory | null): MoodGradient {
  if (category === null) return DEFAULT_GRADIENT;
  return MOOD_GRADIENTS[category] ?? DEFAULT_GRADIENT;
}

export function getMoodAccentColor(category: MoodCategory | null): string {
  return getMoodGradient(category).from;
}
