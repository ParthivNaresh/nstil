import { Canvas } from "@shopify/react-native-skia";
import { useCallback, useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { CelestialDisc } from "./CelestialDisc";
import { PlayerSprite } from "./PlayerSprite";
import { SkyGradient } from "./SkyGradient";
import { StarField } from "./StarField";
import { TerrainLayers } from "./TerrainLayers";
import { generateStarPositions } from "./starPositions";
import type { DriftSceneProps } from "./types";

const HIT_SLOP_LEFT = 40;

interface CanvasSize {
  readonly width: number;
  readonly height: number;
}

const INITIAL_SIZE: CanvasSize = { width: 0, height: 0 };

export function DriftScene({
  dayProgress,
  scrollX,
  playerY,
  isTouching,
  canvasHeight,
}: DriftSceneProps) {
  const [size, setSize] = useState<CanvasSize>(INITIAL_SIZE);
  const hasSize = size.width > 0 && size.height > 0;

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setSize({ width, height });
      canvasHeight.value = height;
    },
    [canvasHeight],
  );

  const stars = useMemo(
    () => (hasSize ? generateStarPositions(size.width, size.height) : []),
    [hasSize, size.width, size.height],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .hitSlop({ left: -HIT_SLOP_LEFT })
        .onTouchesDown(() => {
          "worklet";
          isTouching.value = 1;
        })
        .onTouchesUp(() => {
          "worklet";
          isTouching.value = 0;
        })
        .onTouchesCancelled(() => {
          "worklet";
          isTouching.value = 0;
        }),
    [isTouching],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {hasSize ? (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill}>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <SkyGradient dayProgress={dayProgress} width={size.width} height={size.height} />
              <StarField dayProgress={dayProgress} stars={stars} />
              <CelestialDisc body="sun" dayProgress={dayProgress} width={size.width} height={size.height} />
              <CelestialDisc body="moon" dayProgress={dayProgress} width={size.width} height={size.height} />
              <TerrainLayers
                dayProgress={dayProgress}
                scrollX={scrollX}
                width={size.width}
                height={size.height}
              />
              <PlayerSprite playerY={playerY} isTouching={isTouching} width={size.width} />
            </Canvas>
          </View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
