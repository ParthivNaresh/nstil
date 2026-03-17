import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { useEffect } from "react";
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

  const coreR = useSharedValue(0);
  const coreG = useSharedValue(0);
  const coreB = useSharedValue(0);
  const coreA = useSharedValue(CORE_ALPHA);
  const edgeR = useSharedValue(0);
  const edgeG = useSharedValue(0);
  const edgeB = useSharedValue(0);
  const edgeA = useSharedValue(EDGE_ALPHA);

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

  useEffect(() => {
    const core = hexToShaderColor(colors.accent, CORE_ALPHA);
    coreR.value = core[0];
    coreG.value = core[1];
    coreB.value = core[2];
    coreA.value = core[3];

    const edge = hexToShaderColor(colors.accentLight, EDGE_ALPHA);
    edgeR.value = edge[0];
    edgeG.value = edge[1];
    edgeB.value = edge[2];
    edgeA.value = edge[3];
  }, [colors.accent, colors.accentLight, coreR, coreG, coreB, coreA, edgeR, edgeG, edgeB, edgeA]);

  const minRadius = size * MIN_RADIUS_RATIO;
  const maxRadius = size * MAX_RADIUS_RATIO;

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
    uColorCore: [coreR.value, coreG.value, coreB.value, coreA.value] as const,
    uColorEdge: [edgeR.value, edgeG.value, edgeB.value, edgeA.value] as const,
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
