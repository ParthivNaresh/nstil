import type { MoodCategory } from "@/types";

export type DriftPhase = "idle" | "drifting" | "ending";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

export interface PlayerConfig {
  readonly fixedX: number;
  readonly gravity: number;
  readonly buoyancy: number;
  readonly hoverMargin: number;
  readonly minY: number;
  readonly maxYFraction: number;
}

export interface DriftConfig {
  readonly scrollSpeedPxPerSec: number;
  readonly dayCycleDurationSec: number;
  readonly defaultSessionDurationSec: number;
  readonly player: PlayerConfig;
}

export interface DriftSessionResult {
  readonly durationSec: number;
  readonly moodBefore: MoodCategory | null;
  readonly moodAfter: MoodCategory | null;
}
