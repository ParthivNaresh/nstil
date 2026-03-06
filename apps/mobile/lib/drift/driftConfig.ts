import type { DriftConfig, TerrainLayerConfig } from "./types";

const FAR_LAYER: TerrainLayerConfig = {
  harmonics: [],
  baseHeight: 0.40,
  parallaxFactor: 0.08,
  depthFactor: 0.05,
  ridgeBlend: 0,
  ridgeExponent: 1.0,
  warp: { amplitude: 0, k: 1, phase: 0 },
  loopWidth: 1536,
  pointCount: 0,
};

const MID_FAR_LAYER: TerrainLayerConfig = {
  harmonics: [],
  baseHeight: 0.44,
  parallaxFactor: 0.20,
  depthFactor: 0.22,
  ridgeBlend: 0,
  ridgeExponent: 1.0,
  warp: { amplitude: 0, k: 1, phase: 0 },
  loopWidth: 1536,
  pointCount: 0,
};

const MID_LAYER: TerrainLayerConfig = {
  harmonics: [],
  baseHeight: 0.49,
  parallaxFactor: 0.40,
  depthFactor: 0.42,
  ridgeBlend: 0,
  ridgeExponent: 1.0,
  warp: { amplitude: 0, k: 1, phase: 0 },
  loopWidth: 1536,
  pointCount: 0,
};

const MID_NEAR_LAYER: TerrainLayerConfig = {
  harmonics: [],
  baseHeight: 0.54,
  parallaxFactor: 0.65,
  depthFactor: 0.65,
  ridgeBlend: 0,
  ridgeExponent: 1.0,
  warp: { amplitude: 0, k: 1, phase: 0 },
  loopWidth: 1536,
  pointCount: 0,
};

const NEAR_LAYER: TerrainLayerConfig = {
  harmonics: [],
  baseHeight: 0.58,
  parallaxFactor: 1.0,
  depthFactor: 0.88,
  ridgeBlend: 0,
  ridgeExponent: 1.0,
  warp: { amplitude: 0, k: 1, phase: 0 },
  loopWidth: 1536,
  pointCount: 0,
};

export const DRIFT_CONFIG: DriftConfig = {
  scrollSpeedPxPerSec: 60,
  dayCycleDurationSec: 90,
  defaultSessionDurationSec: 180,
  starCount: 100,
  player: {
    fixedX: 0.25,
    gravity: 120,
    buoyancy: 80,
    hoverMargin: 10,
    minY: 0.1,
    maxYFraction: 0.85,
  },
  layers: [FAR_LAYER, MID_FAR_LAYER, MID_LAYER, MID_NEAR_LAYER, NEAR_LAYER],
};

export const STAR_MIN_RADIUS = 0.5;
export const STAR_MAX_RADIUS = 2.0;
export const STAR_FIELD_Y_FRACTION = 0.5;
