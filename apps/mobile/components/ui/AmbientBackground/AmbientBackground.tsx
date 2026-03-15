import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useCanvasSize } from "@/lib/animation";
import { useThemeStore } from "@/stores/themeStore";

import { getAmbientColors } from "./ambientColors";
import { ambientShader } from "./shader";
import type { AmbientBackgroundProps } from "./types";

const CYCLE_DURATION_MS = 120_000;
const CYCLE_MAX = 1000;

function useActiveCustomAmbient() {
  const customThemes = useThemeStore((s) => s.customThemes);
  const activeCustomId = useThemeStore((s) => s.activeCustomId);

  return useMemo(() => {
    if (!activeCustomId) return null;
    const theme = customThemes.find((t) => t.id === activeCustomId);
    return theme?.built.ambient ?? null;
  }, [customThemes, activeCustomId]);
}

export function AmbientBackground({ style }: AmbientBackgroundProps) {
  const { mode, isDark } = useTheme();
  const customAmbient = useActiveCustomAmbient();
  const { size, onLayout, hasSize } = useCanvasSize();
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
    () => getAmbientColors(mode, isDark, customAmbient),
    [mode, isDark, customAmbient],
  );

  const uniforms = useDerivedValue(() => ({
    uResolution: [size.width, size.height] as const,
    uTime: time.value,
    uColor1: [...colorSet.color1] as const,
    uColor2: [...colorSet.color2] as const,
    uColor3: [...colorSet.color3] as const,
  }));

  if (!ambientShader) {
    return null;
  }

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
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
