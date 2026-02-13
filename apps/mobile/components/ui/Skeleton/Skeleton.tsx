import { useEffect, useMemo } from "react";
import { type DimensionValue, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, duration, radius } from "@/styles";

import type { SkeletonProps, SkeletonShape } from "./types";

const SHIMMER_DURATION = duration.slow * 3;

interface ShapeConfig {
  defaultWidth: DimensionValue;
  defaultHeight: DimensionValue;
  borderRadius: number;
}

const SHAPE_MAP: Record<SkeletonShape, ShapeConfig> = {
  rect: { defaultWidth: "100%", defaultHeight: 80, borderRadius: radius.md },
  circle: { defaultWidth: 40, defaultHeight: 40, borderRadius: radius.full },
  text: { defaultWidth: "100%", defaultHeight: 16, borderRadius: radius.xs },
};

export function Skeleton({
  shape = "text",
  width,
  height,
  testID,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);
  const config = SHAPE_MAP[shape];

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      width: width ?? config.defaultWidth,
      height: height ?? config.defaultHeight,
      borderRadius: config.borderRadius,
      overflow: "hidden",
    }),
    [width, height, config],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    opacity: opacity.value,
  }));

  return (
    <View style={containerStyle} testID={testID}>
      <Animated.View style={animatedStyle} />
    </View>
  );
}
