import {
  FAR_RIDGE,
  MID_FAR_RIDGE,
  MID_NEAR_RIDGE,
  MID_RIDGE,
  NEAR_RIDGE,
} from "./terrainPaths";
import type { DriftConfig, TerrainLayerConfig } from "./types";

const FAR_LAYER: TerrainLayerConfig = {
  ridge: FAR_RIDGE,
  parallaxFactor: 0.08,
  depthFactor: 0.05,
  loopWidth: 1536,
};

const MID_FAR_LAYER: TerrainLayerConfig = {
  ridge: MID_FAR_RIDGE,
  parallaxFactor: 0.20,
  depthFactor: 0.22,
  loopWidth: 1536,
};

const MID_LAYER: TerrainLayerConfig = {
  ridge: MID_RIDGE,
  parallaxFactor: 0.40,
  depthFactor: 0.42,
  loopWidth: 1536,
};

const MID_NEAR_LAYER: TerrainLayerConfig = {
  ridge: MID_NEAR_RIDGE,
  parallaxFactor: 0.65,
  depthFactor: 0.65,
  loopWidth: 1536,
};

const NEAR_LAYER: TerrainLayerConfig = {
  ridge: NEAR_RIDGE,
  parallaxFactor: 1.0,
  depthFactor: 0.88,
  loopWidth: 1536,
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
