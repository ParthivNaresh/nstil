import type { MoodOption } from "./types";

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { value: 1, emoji: "😔", label: "Awful" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
] as const;
