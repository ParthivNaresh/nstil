import type { MoodCategory } from "@/types";

export type DriftPhase = "idle" | "drifting" | "ending";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

export interface Harmonic {
  readonly k: number;
  readonly amplitude: number;
  readonly phase: number;
}

export interface TerrainWarpConfig {
  readonly amplitude: number;
  readonly k: number;
  readonly phase: number;
}

export interface TerrainLayerConfig {
  readonly harmonics: readonly Harmonic[];
  readonly baseHeight: number;
  readonly parallaxFactor: number;
  readonly depthFactor: number;
  readonly ridgeBlend: number;
  readonly ridgeExponent: number;
  readonly warp: TerrainWarpConfig;
  readonly loopWidth: number;
  readonly pointCount: number;
}

export interface DirectionalGradientColors {
  readonly lit: string;
  readonly mid: string;
  readonly shadow: string;
}

export interface GradientEndpoints {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}

export interface LightDirection {
  readonly dx: number;
  readonly dy: number;
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
