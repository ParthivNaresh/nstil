import type { SharedValue } from "react-native-reanimated";

export interface DriftSceneProps {
  readonly time: SharedValue<number>;
  readonly dayProgress: SharedValue<number>;
  readonly scrollX: SharedValue<number>;
  readonly playerY: SharedValue<number>;
  readonly isTouching: SharedValue<number>;
  readonly canvasHeight: SharedValue<number>;
}

export interface EnvironmentLayerProps {
  readonly time: SharedValue<number>;
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
