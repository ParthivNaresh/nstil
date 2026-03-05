export type {
  CelestialPosition,
  DayPhase,
  DriftConfig,
  DriftPhase,
  DriftSessionResult,
  Harmonic,
  PlayerConfig,
  SkyPhaseColors,
  StarPosition,
  TerrainLayerConfig,
  TerrainWarpConfig,
} from "./types";

export { getHarmonicHeight, getTerrainHeight, generateTerrainPath } from "./terrainCurve";

export {
  getDayPhase,
  getMoonPosition,
  getSkyColors,
  getStarOpacity,
  getSunPosition,
  getTerrainTint,
} from "./dayNightCycle";

export {
  DRIFT_CONFIG,
  STAR_FIELD_Y_FRACTION,
  STAR_MAX_RADIUS,
  STAR_MIN_RADIUS,
} from "./driftConfig";
