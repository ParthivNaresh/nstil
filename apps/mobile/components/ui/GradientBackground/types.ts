import type { StyleProp, ViewStyle } from "react-native";

export interface GradientBackgroundProps {
  readonly colors: readonly string[];
  readonly start?: GradientPoint;
  readonly end?: GradientPoint;
  readonly style?: StyleProp<ViewStyle>;
}

export interface GradientPoint {
  readonly x: number;
  readonly y: number;
}
