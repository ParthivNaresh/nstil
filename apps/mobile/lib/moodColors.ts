export interface MoodGradient {
  readonly from: string;
  readonly to: string;
}

const MOOD_GRADIENTS: Record<number, MoodGradient> = {
  1: { from: "#6366F1", to: "#818CF8" },
  2: { from: "#8B5CF6", to: "#A78BFA" },
  3: { from: "#F59E0B", to: "#FBBF24" },
  4: { from: "#10B981", to: "#34D399" },
  5: { from: "#F472B6", to: "#FB923C" },
};

const DEFAULT_GRADIENT: MoodGradient = { from: "#6366F1", to: "#818CF8" };

export function getMoodGradient(score: number | null): MoodGradient {
  if (score === null) return DEFAULT_GRADIENT;
  return MOOD_GRADIENTS[score] ?? DEFAULT_GRADIENT;
}

export function getMoodAccentColor(score: number | null): string {
  return getMoodGradient(score).from;
}
