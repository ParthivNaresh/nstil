import type { AIInsight, MoodCategory } from "@/types";

export interface StreakData {
  readonly streakLength: number;
  readonly milestone: number;
}

export interface WeeklySummaryData {
  readonly entryCount: number;
  readonly dominantMood: MoodCategory | null;
  readonly moodDistribution: Record<string, number>;
  readonly topTags: string[];
  readonly avgEntryLength: number;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface MoodAnomalyData {
  readonly direction: "positive" | "negative";
  readonly difference: number;
}

const MOOD_CATEGORIES: readonly string[] = ["happy", "calm", "sad", "anxious", "angry"];

function isMoodCategory(value: unknown): value is MoodCategory {
  return typeof value === "string" && MOOD_CATEGORIES.includes(value);
}

export function parseStreakData(insight: AIInsight): StreakData | null {
  const { metadata } = insight;
  const streakLength = metadata.streak_length;
  const milestone = metadata.milestone;

  if (typeof streakLength !== "number" || typeof milestone !== "number") {
    return null;
  }

  return { streakLength, milestone };
}

export function parseWeeklySummaryData(insight: AIInsight): WeeklySummaryData | null {
  const { metadata } = insight;
  const entryCount = metadata.entry_count;
  const dominantMoodRaw = metadata.dominant_mood;
  const moodDistribution = metadata.mood_distribution;
  const topTags = metadata.top_tags;
  const avgEntryLength = metadata.avg_entry_length;

  if (typeof entryCount !== "number") {
    return null;
  }

  const dominantMood = isMoodCategory(dominantMoodRaw) ? dominantMoodRaw : null;

  return {
    entryCount,
    dominantMood,
    moodDistribution: typeof moodDistribution === "object" && moodDistribution !== null
      ? (moodDistribution as Record<string, number>)
      : {},
    topTags: Array.isArray(topTags) ? (topTags as string[]) : [],
    avgEntryLength: typeof avgEntryLength === "number" ? avgEntryLength : 0,
    periodStart: insight.period_start ?? "",
    periodEnd: insight.period_end ?? "",
  };
}

export function parseMoodAnomalyData(insight: AIInsight): MoodAnomalyData | null {
  const { metadata } = insight;
  const direction = metadata.direction;
  const difference = metadata.difference;

  if (typeof difference !== "number") {
    return null;
  }

  return {
    direction: direction === "positive" ? "positive" : "negative",
    difference: Math.abs(difference),
  };
}

export function formatPeriodLabel(periodStart: string, periodEnd: string): string {
  if (!periodStart || !periodEnd) return "";

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${startStr} – ${endStr}`;
}
