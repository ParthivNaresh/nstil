import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";

import { useCanvasSize } from "@/lib/animation";

import type { GradientBackgroundProps } from "./types";

const DEFAULT_START = { x: 0, y: 0 };
const DEFAULT_END = { x: 1, y: 1 };

export function GradientBackground({
  colors,
  start = DEFAULT_START,
  end = DEFAULT_END,
  style,
}: GradientBackgroundProps) {
  const { size, onLayout, hasSize } = useCanvasSize();

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {hasSize ? (
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={size.width} height={size.height}>
            <LinearGradient
              start={vec(start.x * size.width, start.y * size.height)}
              end={vec(end.x * size.width, end.y * size.height)}
              colors={colors as string[]}
            />
          </Rect>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  canvas: {
    flex: 1,
  },
});
