export type {
  CelestialPosition,
  DayPhase,
  DirectionalGradientColors,
  DriftConfig,
  DriftPhase,
  DriftSessionResult,
  GradientEndpoints,
  Harmonic,
  LightDirection,
  PlayerConfig,
  SkyPhaseColors,
  StarPosition,
  TerrainLayerConfig,
  TerrainWarpConfig,
} from "./types";

export {
  getDayPhase,
  getDirectionalGradient,
  getGradientEndpoints,
  getLightDirection,
  getMoonPosition,
  getSilhouetteFloat4,
  getSkyBottomFloat4,
  getSkyColors,
  getStarOpacity,
  getSunInfluence,
  getSunPosition,
  getWarmTintFloat4,
} from "./dayNightCycle";

export {
  DRIFT_CONFIG,
  STAR_FIELD_Y_FRACTION,
  STAR_MAX_RADIUS,
  STAR_MIN_RADIUS,
} from "./driftConfig";

export { terrainShader } from "./terrainShader";

export type { AuthoredRidgeData } from "./terrainPaths";

export { FAR_RIDGE, MID_FAR_RIDGE, MID_NEAR_RIDGE, MID_RIDGE, NEAR_RIDGE } from "./terrainPaths";
