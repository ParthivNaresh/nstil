import type { DriftConfig, TerrainLayerConfig } from "./types";

const FAR_LAYER: TerrainLayerConfig = {
  harmonics: [
    { k: 1, amplitude: 10, phase: 0.0 },
    { k: 2, amplitude: 6, phase: 1.8 },
    { k: 3, amplitude: 3, phase: 3.7 },
  ],
  baseHeight: 0.48,
  parallaxFactor: 0.12,
  depthFactor: 0.0,
  ridgeBlend: 0.55,
  ridgeExponent: 1.0,
  warp: { amplitude: 8, k: 2, phase: 0.0 },
};

const MID_FAR_LAYER: TerrainLayerConfig = {
  harmonics: [
    { k: 2, amplitude: 18, phase: 0.5 },
    { k: 1, amplitude: 10, phase: 2.3 },
    { k: 3, amplitude: 7, phase: 4.1 },
    { k: 5, amplitude: 4, phase: 1.2 },
  ],
  baseHeight: 0.58,
  parallaxFactor: 0.25,
  depthFactor: 0.25,
  ridgeBlend: 0.62,
  ridgeExponent: 1.1,
  warp: { amplitude: 12, k: 3, phase: 1.5 },
};

const MID_LAYER: TerrainLayerConfig = {
  harmonics: [
    { k: 2, amplitude: 28, phase: 1.4 },
    { k: 3, amplitude: 16, phase: 3.8 },
    { k: 1, amplitude: 12, phase: 0.6 },
    { k: 5, amplitude: 8, phase: 2.2 },
    { k: 7, amplitude: 4, phase: 5.0 },
  ],
  baseHeight: 0.68,
  parallaxFactor: 0.45,
  depthFactor: 0.5,
  ridgeBlend: 0.70,
  ridgeExponent: 1.3,
  warp: { amplitude: 18, k: 2, phase: 3.0 },
};

const MID_NEAR_LAYER: TerrainLayerConfig = {
  harmonics: [
    { k: 3, amplitude: 35, phase: 0.9 },
    { k: 2, amplitude: 20, phase: 3.3 },
    { k: 5, amplitude: 14, phase: 1.7 },
    { k: 1, amplitude: 10, phase: 4.8 },
    { k: 7, amplitude: 7, phase: 2.5 },
    { k: 11, amplitude: 4, phase: 0.3 },
  ],
  baseHeight: 0.78,
  parallaxFactor: 0.7,
  depthFactor: 0.75,
  ridgeBlend: 0.78,
  ridgeExponent: 1.5,
  warp: { amplitude: 24, k: 3, phase: 4.5 },
};

const NEAR_LAYER: TerrainLayerConfig = {
  harmonics: [
    { k: 3, amplitude: 40, phase: 2.1 },
    { k: 2, amplitude: 25, phase: 4.6 },
    { k: 5, amplitude: 18, phase: 0.8 },
    { k: 7, amplitude: 12, phase: 3.4 },
    { k: 1, amplitude: 8, phase: 1.5 },
    { k: 11, amplitude: 6, phase: 5.2 },
    { k: 13, amplitude: 3, phase: 2.8 },
  ],
  baseHeight: 0.86,
  parallaxFactor: 1.0,
  depthFactor: 1.0,
  ridgeBlend: 0.85,
  ridgeExponent: 1.8,
  warp: { amplitude: 30, k: 2, phase: 2.2 },
};

export const DRIFT_CONFIG: DriftConfig = {
  scrollSpeedPxPerSec: 60,
  terrainLoopWidth: 1200,
  terrainPointCount: 450,
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
