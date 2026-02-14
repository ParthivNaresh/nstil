import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";

import { getAmbientColors } from "./ambientColors";
import { ambientShader } from "./shader";
import type { AmbientBackgroundProps } from "./types";

const CYCLE_DURATION_MS = 120_000;
const CYCLE_MAX = 1000;

export function AmbientBackground({ style }: AmbientBackgroundProps) {
  const { mode, isDark } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(CYCLE_MAX, {
        duration: CYCLE_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(time);
  }, [time]);

  const colorSet = useMemo(
    () => getAmbientColors(mode, isDark),
    [mode, isDark],
  );

  const uniforms = useDerivedValue(() => ({
    uResolution: [size.width, size.height] as const,
    uTime: time.value,
    uColor1: [...colorSet.color1] as const,
    uColor2: [...colorSet.color2] as const,
    uColor3: [...colorSet.color3] as const,
  }));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const hasSize = size.width > 0 && size.height > 0;

  if (!ambientShader) {
    return null;
  }

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {hasSize ? (
        <Canvas style={styles.canvas}>
          <Fill>
            <Shader source={ambientShader} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
});
