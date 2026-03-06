import type { MoodCategory } from "@/types";

import type { AuthoredRidgeData } from "./terrainPaths";

export type DriftPhase = "idle" | "drifting" | "ending";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

export interface TerrainLayerConfig {
  readonly ridge: AuthoredRidgeData;
  readonly parallaxFactor: number;
  readonly depthFactor: number;
  readonly loopWidth: number;
}

export interface SkyPhaseColors {
  readonly top: string;
  readonly bottom: string;
}

export interface CelestialPosition {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
}

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
  readonly starCount: number;
  readonly player: PlayerConfig;
  readonly layers: readonly TerrainLayerConfig[];
}

export interface DriftSessionResult {
  readonly durationSec: number;
  readonly moodBefore: MoodCategory | null;
  readonly moodAfter: MoodCategory | null;
}

export interface StarPosition {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}
