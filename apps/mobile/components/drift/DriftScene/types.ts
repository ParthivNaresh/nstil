import type { SharedValue } from "react-native-reanimated";

import type { StarPosition } from "@/lib/drift";

export interface DriftSceneProps {
  readonly dayProgress: SharedValue<number>;
  readonly scrollX: SharedValue<number>;
  readonly playerY: SharedValue<number>;
  readonly isTouching: SharedValue<number>;
  readonly canvasHeight: SharedValue<number>;
}

export interface SkyGradientProps {
  readonly dayProgress: SharedValue<number>;
  readonly width: number;
  readonly height: number;
}

export interface StarFieldProps {
  readonly dayProgress: SharedValue<number>;
  readonly stars: readonly StarPosition[];
}

export type CelestialBody = "sun" | "moon";

export interface CelestialDiscProps {
  readonly body: CelestialBody;
  readonly dayProgress: SharedValue<number>;
  readonly width: number;
  readonly height: number;
}

export interface TerrainLayersProps {
  readonly dayProgress: SharedValue<number>;
  readonly scrollX: SharedValue<number>;
  readonly width: number;
  readonly height: number;
}

export interface PlayerSpriteProps {
  readonly playerY: SharedValue<number>;
  readonly isTouching: SharedValue<number>;
  readonly width: number;
}
