import { Canvas, Circle, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import type { BreathingPhase } from "@/types/breathing";

interface BreathingCircleProps {
  readonly phase: BreathingPhase;
  readonly progress: SharedValue<number>;
  readonly size: number;
}

const MIN_RADIUS_RATIO = 0.35;
const MAX_RADIUS_RATIO = 0.48;
const HOLD_OPACITY_MIN = 0.6;
const HOLD_OPACITY_MAX = 0.9;
const ACTIVE_OPACITY = 0.8;
const GLOW_RADIUS_OFFSET = 12;
const GLOW_OPACITY = 0.15;

function interpolate(from: number, to: number, t: number): number {
  "worklet";
  return from + (to - from) * t;
}

export function BreathingCircle({ phase, progress, size }: BreathingCircleProps) {
  const { colors } = useTheme();
  const center = useMemo(() => vec(size / 2, size / 2), [size]);
  const minRadius = size * MIN_RADIUS_RATIO;
  const maxRadius = size * MAX_RADIUS_RATIO;

  const animatedRadius = useDerivedValue(() => {
    switch (phase) {
      case "inhale":
        return interpolate(minRadius, maxRadius, progress.value);
      case "exhale":
        return interpolate(maxRadius, minRadius, progress.value);
      case "hold":
      case "rest":
        return phase === "hold" ? maxRadius : minRadius;
    }
  }, [phase, minRadius, maxRadius]);

  const animatedOpacity = useDerivedValue(() => {
    if (phase === "hold" || phase === "rest") {
      return interpolate(HOLD_OPACITY_MAX, HOLD_OPACITY_MIN, progress.value);
    }
    return ACTIVE_OPACITY;
  }, [phase]);

  const circleColor = withAlpha(colors.accent, ACTIVE_OPACITY);
  const glowColor = withAlpha(colors.accent, GLOW_OPACITY);

  const glowRadius = useDerivedValue(
    () => animatedRadius.value + GLOW_RADIUS_OFFSET,
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle
          cx={center.x}
          cy={center.y}
          r={glowRadius}
          color={glowColor}
          opacity={animatedOpacity}
        />
        <Circle
          cx={center.x}
          cy={center.y}
          r={animatedRadius}
          color={circleColor}
          opacity={animatedOpacity}
        />
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
