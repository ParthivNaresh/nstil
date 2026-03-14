import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";

interface ProgressRingProps {
  readonly size: number;
  readonly currentCycle: number;
  readonly totalCycles: number;
  readonly phaseIndex: number;
  readonly phaseCount: number;
}

const STROKE_WIDTH = 3;
const TRACK_OPACITY = 0.08;
const RING_OPACITY = 0.5;
const RING_INSET = 8;
const START_ANGLE = -90;
const FULL_SWEEP = 360;

function createArcPath(
  cx: number,
  cy: number,
  r: number,
  sweepDeg: number,
): string {
  if (sweepDeg >= FULL_SWEEP) {
    const path = Skia.Path.Make();
    path.addCircle(cx, cy, r);
    return path.toSVGString();
  }

  const path = Skia.Path.Make();
  const oval = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  path.addArc(oval, START_ANGLE, sweepDeg);
  return path.toSVGString();
}

export function ProgressRing({
  size,
  currentCycle,
  totalCycles,
  phaseIndex,
  phaseCount,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - RING_INSET - STROKE_WIDTH / 2;

  const trackPath = useMemo(() => createArcPath(cx, cy, r, FULL_SWEEP), [cx, cy, r]);
  const trackColor = withAlpha(colors.accent, TRACK_OPACITY);
  const ringColor = withAlpha(colors.accent, RING_OPACITY);

  const totalSteps = totalCycles * phaseCount;

  const arcPath = useMemo(() => {
    const completedSteps = currentCycle * phaseCount + phaseIndex;
    const totalFraction = Math.min(completedSteps / totalSteps, 1);
    const sweep = totalFraction * FULL_SWEEP;
    if (sweep < 0.1) return null;
    return createArcPath(cx, cy, r, sweep);
  }, [currentCycle, phaseIndex, phaseCount, totalSteps, cx, cy, r]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path
          path={trackPath}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          strokeCap="round"
          color={trackColor}
        />
        {arcPath ? (
          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={STROKE_WIDTH}
            strokeCap="round"
            color={ringColor}
          />
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});
