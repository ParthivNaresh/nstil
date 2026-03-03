import type { MoodCategory, MoodSpecific } from "./journal";

export interface CalendarDay {
  readonly date: string;
  readonly mood_category: MoodCategory | null;
  readonly mood_specific: MoodSpecific | null;
  readonly entry_count: number;
}

export interface CalendarResponse {
  readonly year: number;
  readonly month: number;
  readonly days: CalendarDay[];
  readonly total_entries: number;
  readonly streak: number;
}

export interface DailyMoodCount {
  readonly date: string;
  readonly mood_category: string;
  readonly entry_count: number;
}

export interface MoodTrendResponse {
  readonly items: DailyMoodCount[];
  readonly days: number;
}
