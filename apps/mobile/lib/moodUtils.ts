import { MOOD_OPTIONS } from "@/components/ui/MoodSelector/moods";

export function getMoodEmoji(score: number | null): string | null {
  if (score === null) return null;
  const option = MOOD_OPTIONS.find((m) => m.value === score);
  return option?.emoji ?? null;
}

export function getMoodLabel(score: number | null): string | null {
  if (score === null) return null;
  const option = MOOD_OPTIONS.find((m) => m.value === score);
  return option?.label ?? null;
}
