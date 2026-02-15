import type { MoodCategory, MoodSpecific } from "@/types";

const CATEGORY_LABELS: Record<MoodCategory, string> = {
  happy: "Happy",
  calm: "Calm",
  sad: "Sad",
  anxious: "Anxious",
  angry: "Angry",
};

const SPECIFIC_LABELS: Record<MoodSpecific, string> = {
  joyful: "Joyful",
  grateful: "Grateful",
  excited: "Excited",
  proud: "Proud",
  peaceful: "Peaceful",
  content: "Content",
  relaxed: "Relaxed",
  hopeful: "Hopeful",
  down: "Down",
  lonely: "Lonely",
  disappointed: "Disappointed",
  nostalgic: "Nostalgic",
  stressed: "Stressed",
  worried: "Worried",
  overwhelmed: "Overwhelmed",
  restless: "Restless",
  frustrated: "Frustrated",
  irritated: "Irritated",
  hurt: "Hurt",
  resentful: "Resentful",
};

export function getMoodLabel(category: MoodCategory | null): string | null {
  if (category === null) return null;
  return CATEGORY_LABELS[category] ?? null;
}

export function getMoodSpecificLabel(specific: MoodSpecific | null): string | null {
  if (specific === null) return null;
  return SPECIFIC_LABELS[specific] ?? null;
}

export function getMoodDisplayLabel(
  category: MoodCategory | null,
  specific: MoodSpecific | null,
): string | null {
  if (category === null) return null;
  if (specific !== null) {
    return SPECIFIC_LABELS[specific] ?? CATEGORY_LABELS[category] ?? null;
  }
  return CATEGORY_LABELS[category] ?? null;
}

export const MOOD_CATEGORIES: readonly MoodCategory[] = [
  "happy",
  "calm",
  "sad",
  "anxious",
  "angry",
] as const;

export const MOOD_CATEGORY_SPECIFICS: Record<MoodCategory, readonly MoodSpecific[]> = {
  happy: ["joyful", "grateful", "excited", "proud"],
  calm: ["peaceful", "content", "relaxed", "hopeful"],
  sad: ["down", "lonely", "disappointed", "nostalgic"],
  anxious: ["stressed", "worried", "overwhelmed", "restless"],
  angry: ["frustrated", "irritated", "hurt", "resentful"],
};
