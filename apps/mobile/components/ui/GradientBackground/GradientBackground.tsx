import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import type { GradientBackgroundProps } from "./types";

const DEFAULT_START = { x: 0, y: 0 };
const DEFAULT_END = { x: 1, y: 1 };

export function GradientBackground({
  colors,
  start = DEFAULT_START,
  end = DEFAULT_END,
  style,
}: GradientBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const { width, height } = size;
  const hasSize = width > 0 && height > 0;

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {hasSize ? (
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(start.x * width, start.y * height)}
              end={vec(end.x * width, end.y * height)}
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
