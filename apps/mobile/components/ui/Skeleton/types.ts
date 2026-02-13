import type { DimensionValue } from "react-native";

export type SkeletonShape = "rect" | "circle" | "text";

export interface SkeletonProps {
  shape?: SkeletonShape;
  width?: DimensionValue;
  height?: DimensionValue;
  testID?: string;
}
