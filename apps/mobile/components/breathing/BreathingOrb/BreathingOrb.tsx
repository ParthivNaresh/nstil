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
import { lerp } from "@/lib/animation";

import { hexToShaderColor } from "./colors";
import { breathingOrbShader } from "./shader";
import type { BreathingOrbProps } from "./types";

const MIN_RADIUS_RATIO = 0.35;
const MAX_RADIUS_RATIO = 0.48;
const HOLD_OPACITY_MIN = 0.6;
const HOLD_OPACITY_MAX = 0.9;
const ACTIVE_OPACITY = 0.8;
const CYCLE_DURATION_MS = 120_000;
const CYCLE_MAX = 1000;
const CORE_ALPHA = 0.9;
const EDGE_ALPHA = 0.6;

const PHASE_INHALE = 0;
const PHASE_HOLD = 1;
const PHASE_EXHALE = 2;

export function BreathingOrb({ phaseSignal, progress, size }: BreathingOrbProps) {
  const { colors } = useTheme();
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

  const minRadius = size * MIN_RADIUS_RATIO;
  const maxRadius = size * MAX_RADIUS_RATIO;

  const colorCore = useMemo(
    () => hexToShaderColor(colors.accent, CORE_ALPHA),
    [colors.accent],
  );

  const colorEdge = useMemo(
    () => hexToShaderColor(colors.accentLight, EDGE_ALPHA),
    [colors.accentLight],
  );

  const animatedRadius = useDerivedValue(() => {
    const p = phaseSignal.value;
    const t = progress.value;
    if (p === PHASE_INHALE) return lerp(minRadius, maxRadius, t);
    if (p === PHASE_EXHALE) return lerp(maxRadius, minRadius, t);
    if (p === PHASE_HOLD) return maxRadius;
    return minRadius;
  });

  const animatedOpacity = useDerivedValue(() => {
    const p = phaseSignal.value;
    if (p === PHASE_HOLD || p > PHASE_EXHALE) {
      return lerp(HOLD_OPACITY_MAX, HOLD_OPACITY_MIN, progress.value);
    }
    return ACTIVE_OPACITY;
  });

  const uniforms = useDerivedValue(() => ({
    uResolution: [size, size] as const,
    uTime: time.value,
    uRadius: animatedRadius.value,
    uOpacity: animatedOpacity.value,
    uColorCore: colorCore,
    uColorEdge: colorEdge,
  }));

  if (!breathingOrbShader) {
    return null;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={breathingOrbShader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
