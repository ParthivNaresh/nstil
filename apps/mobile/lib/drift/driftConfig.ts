import type { DriftConfig } from "./types";

export const DRIFT_CONFIG: DriftConfig = {
  scrollSpeedPxPerSec: 60,
  dayCycleDurationSec: 90,
  defaultSessionDurationSec: 180,
  player: {
    fixedX: 0.25,
    gravity: 120,
    buoyancy: 80,
    hoverMargin: 10,
    minY: 0.1,
    maxYFraction: 0.85,
  },
};
