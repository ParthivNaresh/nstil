import type { MoodCategory } from "./journal";

export type BreathingPatternId = "box" | "478" | "calm";

export type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

export interface BreathingSession {
  readonly id: string;
  readonly user_id: string;
  readonly pattern: BreathingPatternId;
  readonly duration_seconds: number;
  readonly cycles_completed: number;
  readonly cycles_target: number;
  readonly mood_before: MoodCategory | null;
  readonly mood_after: MoodCategory | null;
  readonly completed: boolean;
  readonly created_at: string;
}

export interface BreathingSessionCreate {
  readonly pattern: BreathingPatternId;
  readonly duration_seconds: number;
  readonly cycles_target: number;
  readonly mood_before?: MoodCategory;
}

export interface BreathingSessionUpdate {
  readonly cycles_completed?: number;
  readonly mood_after?: MoodCategory;
  readonly completed?: boolean;
}

export interface BreathingStats {
  readonly total_sessions: number;
  readonly completed_sessions: number;
  readonly total_minutes: number;
  readonly sessions_this_week: number;
}

export interface BreathingPhaseConfig {
  readonly phase: BreathingPhase;
  readonly duration: number;
}

export interface BreathingPatternConfig {
  readonly id: BreathingPatternId;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly phases: readonly BreathingPhaseConfig[];
  readonly cycleDuration: number;
}
